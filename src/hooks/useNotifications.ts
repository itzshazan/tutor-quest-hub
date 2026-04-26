import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const DERIVED_MESSAGE_PREFIX = "unread-message-";
const DERIVED_SESSION_PREFIX = "pending-session-";

const isDerivedNotificationId = (id: string) =>
  id.startsWith(DERIVED_MESSAGE_PREFIX) || id.startsWith(DERIVED_SESSION_PREFIX);

const truncate = (value: string, max = 80) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}...`;
};

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [{ data: dbNotifications }, { data: conversations }, { data: pendingSessions }] =
        await Promise.all([
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("conversations")
            .select("id, student_id, tutor_id")
            .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`),
          supabase
            .from("sessions")
            .select("id, student_id, subject, session_date, start_time, created_at")
            .eq("tutor_id", user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      const db = (dbNotifications || []) as Notification[];
      const hasUnreadDbMessage = db.some((n) => !n.read_at && n.type === "message");
      const hasUnreadDbSessionRequest = db.some(
        (n) =>
          !n.read_at &&
          n.type === "session" &&
          /request/i.test(`${n.title} ${n.message}`)
      );

      let messageNotifications: Notification[] = [];
      if (!hasUnreadDbMessage && conversations && conversations.length > 0) {
        const convoIds = conversations.map((c) => c.id);
        const otherUserIds = conversations.map((c) =>
          c.student_id === user.id ? c.tutor_id : c.student_id
        );

        const [{ data: unreadMessages }, { data: profiles }] = await Promise.all([
          supabase
            .from("messages")
            .select("conversation_id, content, created_at")
            .in("conversation_id", convoIds)
            .neq("sender_id", user.id)
            .is("read_at", null)
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", [...new Set(otherUserIds)]),
        ]);

        if (unreadMessages && unreadMessages.length > 0) {
          const profileMap = new Map(
            (profiles || []).map((p) => [p.user_id, p.full_name || "Someone"])
          );
          const convoMap = new Map(conversations.map((c) => [c.id, c]));

          const messageSummaryMap = new Map<
            string,
            { count: number; preview: string; created_at: string; senderName: string }
          >();

          for (const msg of unreadMessages) {
            const existing = messageSummaryMap.get(msg.conversation_id);
            if (!existing) {
              const convo = convoMap.get(msg.conversation_id);
              const otherId = convo
                ? convo.student_id === user.id
                  ? convo.tutor_id
                  : convo.student_id
                : "";
              messageSummaryMap.set(msg.conversation_id, {
                count: 1,
                preview: truncate(msg.content),
                created_at: msg.created_at,
                senderName: profileMap.get(otherId) || "Someone",
              });
            } else {
              existing.count += 1;
            }
          }

          messageNotifications = Array.from(messageSummaryMap.entries()).map(
            ([conversationId, summary]) => ({
              id: `${DERIVED_MESSAGE_PREFIX}${conversationId}`,
              user_id: user.id,
              title: summary.count === 1 ? "New Message" : `${summary.count} New Messages`,
              message: `${summary.senderName}: ${summary.preview}`,
              type: "message",
              link: `/messages?c=${conversationId}`,
              read_at: null,
              created_at: summary.created_at,
            })
          );
        }
      }

      let sessionRequestNotifications: Notification[] = [];
      if (!hasUnreadDbSessionRequest && pendingSessions && pendingSessions.length > 0) {
        const studentIds = [...new Set(pendingSessions.map((s) => s.student_id))];
        const { data: studentProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);

        const studentMap = new Map(
          (studentProfiles || []).map((p) => [p.user_id, p.full_name || "A student"])
        );

        sessionRequestNotifications = pendingSessions.map((session) => {
          const studentName = studentMap.get(session.student_id) || "A student";
          const details = `${session.subject} on ${session.session_date} at ${session.start_time.slice(0, 5)}`;

          return {
            id: `${DERIVED_SESSION_PREFIX}${session.id}`,
            user_id: user.id,
            title: "New Session Request",
            message: `${studentName} requested ${details}.`,
            type: "session",
            link: "/dashboard/tutor",
            read_at: null,
            created_at: session.created_at,
          };
        });
      }

      const merged = [...db, ...messageNotifications, ...sessionRequestNotifications]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 20);

      setNotifications(merged);
      setUnreadCount(merged.filter((n) => !n.read_at).length);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          loadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          loadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `tutor_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `tutor_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    const readAt = new Date().toISOString();

    if (!isDerivedNotificationId(notificationId)) {
      await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", notificationId);
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read_at: readAt } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const readAt = new Date().toISOString();

    await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .is("read_at", null);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || readAt }))
    );
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
