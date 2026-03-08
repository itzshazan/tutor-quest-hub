import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, Send, ArrowLeft, MessageSquare, Search, Check, CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ConversationListSkeleton, ChatMessagesSkeleton } from "@/components/skeletons/MessagesSkeleton";

interface Conversation {
  id: string;
  student_id: string;
  tutor_id: string;
  updated_at: string;
  other_user: { full_name: string; avatar_url: string | null };
  last_message?: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const activeConvoId = searchParams.get("c");
  const initTutorId = searchParams.get("tutor");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (!convos) { setLoadingConvos(false); return; }

    const enriched: Conversation[] = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.student_id === user.id ? c.tutor_id : c.student_id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", otherId)
          .single();

        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Unread count
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        return {
          ...c,
          other_user: profile || { full_name: "Unknown", avatar_url: null },
          last_message: lastMsg?.content,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enriched);
    setLoadingConvos(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Auto-create conversation if ?tutor= param
  useEffect(() => {
    if (!user || !initTutorId || initTutorId === user.id) return;
    const createOrFind = async () => {
      // Check existing
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(student_id.eq.${user.id},tutor_id.eq.${initTutorId}),and(student_id.eq.${initTutorId},tutor_id.eq.${user.id})`)
        .limit(1)
        .single();

      if (existing) {
        navigate(`/messages?c=${existing.id}`, { replace: true });
        return;
      }

      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({ student_id: user.id, tutor_id: initTutorId })
        .select("id")
        .single();

      if (error) {
        toast({ title: "Could not start conversation", description: error.message, variant: "destructive" });
        return;
      }
      await loadConversations();
      navigate(`/messages?c=${newConvo.id}`, { replace: true });
    };
    createOrFind();
  }, [user, initTutorId, navigate, toast, loadConversations]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvoId) { setMessages([]); return; }
    setLoadingMessages(true);
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvoId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoadingMessages(false);

      // Mark unread as read
      if (user) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", activeConvoId)
          .neq("sender_id", user.id)
          .is("read_at", null);
      }
    };
    load();
  }, [activeConvoId, user]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConvoId) return;
    const channel = supabase
      .channel(`messages:${activeConvoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvoId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          // Auto-mark as read if from other user
          if (user && msg.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id)
              .then();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvoId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === (payload.new as Message).id ? (payload.new as Message) : m))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvoId, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime for conversation list updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        loadConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadConversations]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvoId || !user) return;
    setSending(true);

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConvoId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
      // Touch conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConvoId);
    }
    setSending(false);
  };

  const filteredConvos = conversations.filter((c) =>
    c.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <GraduationCap className="h-6 w-6" /> Tutor Quest
          </Link>
          <span className="text-sm text-muted-foreground">— Messages</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div
          className={`w-full border-r md:w-80 md:block ${activeConvoId ? "hidden" : "block"}`}
        >
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-7.5rem)]">
            {loadingConvos ? (
              <ConversationListSkeleton />
            ) : filteredConvos.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">No conversations yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Find a tutor and start chatting!
                </p>
                <Button size="sm" asChild className="mt-4">
                  <Link to="/find-tutors">Find Tutors</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5 p-1">
                {filteredConvos.map((c) => {
                  const initials = c.other_user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const isActive = c.id === activeConvoId;
                  return (
                    <Link
                      key={c.id}
                      to={`/messages?c=${c.id}`}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                        isActive
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={c.other_user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium">{c.other_user.full_name}</p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs text-muted-foreground">
                            {c.last_message || "No messages yet"}
                          </p>
                          {c.unread_count > 0 && (
                            <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className={`flex flex-1 flex-col ${!activeConvoId ? "hidden md:flex" : "flex"}`}>
          {!activeConvoId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground/20" />
              <p className="mt-4 font-display text-lg font-semibold text-muted-foreground">
                Select a conversation
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose from the list or find a tutor to message
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Link
                  to="/messages"
                  className="md:hidden text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                {activeConvo && (
                  <>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={activeConvo.other_user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {activeConvo.other_user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{activeConvo.other_user.full_name}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                {loadingMessages ? (
                  <ChatMessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Say hello! 👋
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <div
                              className={`mt-1 flex items-center gap-1 text-[10px] ${
                                isMine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              {isMine && (
                                msg.read_at
                                  ? <CheckCheck className="h-3 w-3" />
                                  : <Check className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSend} className="border-t p-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength={2000}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
