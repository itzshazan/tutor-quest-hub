import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, MessageSquare, Search, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ConversationListSkeleton, ChatMessagesSkeleton } from "@/components/skeletons/MessagesSkeleton";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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
  const [userRole, setUserRole] = useState<"student" | "tutor">("student");
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

  // Detect role
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("role").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.role === "tutor") setUserRole("tutor");
    });
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Load conversations with optimized single-query approach
  const loadConversations = useCallback(async () => {
    if (!user) return;

    // Step 1: Fetch all conversations for the user
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoadingConvos(false);
      return;
    }

    // Step 2: Collect all other user IDs in one array
    const otherUserIds = convos.map((c) =>
      c.student_id === user.id ? c.tutor_id : c.student_id
    );
    const convoIds = convos.map((c) => c.id);

    // Step 3: Batch fetch all profiles at once (no N+1)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", otherUserIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Step 4: Batch fetch last messages for all conversations
    // Use a single query with window function approach via ordering
    const { data: allMessages } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false });

    // Group by conversation and get first (latest) message
    const lastMessageMap = new Map<string, string>();
    if (allMessages) {
      for (const msg of allMessages) {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg.content);
        }
      }
    }

    // Step 5: Batch fetch unread counts
    const { data: unreadMessages } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convoIds)
      .neq("sender_id", user.id)
      .is("read_at", null);

    const unreadCountMap = new Map<string, number>();
    if (unreadMessages) {
      for (const msg of unreadMessages) {
        unreadCountMap.set(
          msg.conversation_id,
          (unreadCountMap.get(msg.conversation_id) || 0) + 1
        );
      }
    }

    // Step 6: Combine all data
    const enriched: Conversation[] = convos.map((c) => {
      const otherId = c.student_id === user.id ? c.tutor_id : c.student_id;
      const profile = profileMap.get(otherId);

      return {
        ...c,
        other_user: profile
          ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
          : { full_name: "Unknown", avatar_url: null },
        last_message: lastMessageMap.get(c.id),
        unread_count: unreadCountMap.get(c.id) || 0,
      };
    });

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
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="h-12 w-48 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden gap-4 relative" id="main-content">
        {/* Conversation list Sidebar */}
        <div
          className={`w-full md:w-[320px] shrink-0 border-[3px] border-[#2b2b2b] rounded-[20px] bg-white shadow-[4px_4px_0px_0px_#2b2b2b] flex flex-col overflow-hidden relative ${activeConvoId ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-4 border-b-2 border-[#2b2b2b]/10">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777]" strokeWidth={2.5} aria-hidden="true" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 h-11 border-2 border-[#2b2b2b] rounded-xl shadow-[2px_2px_0px_0px_#2b2b2b] focus-visible:ring-0 focus-visible:border-[#ff6b5c] font-medium text-[15px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search conversations"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingConvos ? (
              <ConversationListSkeleton />
            ) : filteredConvos.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <MessageSquare className="h-12 w-12 text-[#2b2b2b]/20 mb-4" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-[15px] font-bold text-[#2b2b2b]">No conversations yet</p>
                <p className="mt-1 text-[13px] font-medium text-[#777]">
                  Find a tutor and start chatting!
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2 pb-32" role="list" aria-label="Conversations">
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
                      className={`flex items-center gap-3.5 rounded-xl px-3 py-3 transition-all ${
                        isActive
                          ? "bg-[#fdfbf7] border-2 border-[#2b2b2b] shadow-[2px_2px_0px_0px_#2b2b2b]"
                          : "hover:bg-[#fdfbf7] border-2 border-transparent hover:border-[#2b2b2b]/10"
                      }`}
                      role="listitem"
                      aria-current={isActive ? "true" : undefined}
                    >
                      <Avatar className="h-11 w-11 shrink-0 border-2 border-[#2b2b2b]">
                        <AvatarImage src={c.other_user.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#a2d2ff] text-sm font-bold text-[#2b2b2b]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="truncate text-[15px] font-bold text-[#2b2b2b] font-kalam leading-none">{c.other_user.full_name}</p>
                          <span className="shrink-0 text-[11px] font-bold text-[#777]">
                            {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`truncate text-[13px] ${isActive ? "font-semibold text-[#2b2b2b]" : "font-medium text-[#777]"}`}>
                            {c.last_message || "No messages yet"}
                          </p>
                          {c.unread_count > 0 && (
                            <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#2b2b2b] bg-[#ff6b5c] px-1.5 text-[11px] font-black text-white shadow-[1px_1px_0px_0px_#2b2b2b]" aria-label={`${c.unread_count} unread messages`}>
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
          
          {/* Books Illustration at bottom of sidebar */}
          <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none bg-gradient-to-t from-white via-white to-transparent pt-12 flex items-end">
            <img src="/messages-books.png" alt="Learn Create Explore Books" className="w-[140px] object-contain ml-2 mb-[-8px]" />
            <div className="absolute right-6 bottom-16 w-6 h-6 rounded-full bg-[#ffb4a2] border-2 border-[#2b2b2b]"></div>
            <svg className="absolute left-6 bottom-32 opacity-80" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b2b2b" strokeWidth="2"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z" fill="#ffd166"/></svg>
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex flex-1 flex-col ${!activeConvoId ? "hidden md:flex" : "flex"}`}>
          {!activeConvoId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center relative">
              <img src="/messages-empty.png" alt="Chat bubbles" className="w-[280px] object-contain mb-4 z-10 mix-blend-multiply" />
              <h2 className="font-kalam text-3xl font-bold text-[#2b2b2b] mb-2 z-10">
                Select a conversation
              </h2>
              <p className="text-[15px] font-medium text-[#777] mb-8 z-10">
                Choose from the list or find a tutor to message
              </p>
              <Button asChild className="z-10 bg-[#ff6b5c] text-white hover:bg-[#e65c4e] border-[3px] border-[#2b2b2b] shadow-[4px_4px_0px_0px_#2b2b2b] hover:shadow-[6px_6px_0px_0px_#2b2b2b] rounded-xl font-bold px-10 h-12 text-base transition-all hover:-translate-y-1">
                <Link to="/find-tutors">Find Tutors</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col bg-white border-[3px] border-[#2b2b2b] rounded-[20px] shadow-[4px_4px_0px_0px_#2b2b2b] overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b-2 border-[#2b2b2b] px-4 py-3 bg-[#fdfbf7]">
                <Link
                  to="/messages"
                  className="text-[#2b2b2b] hover:text-[#ff6b5c] transition-colors md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                </Link>
                {activeConvo && (
                  <>
                    <Avatar className="h-10 w-10 border-2 border-[#2b2b2b] shadow-[2px_2px_0px_0px_#2b2b2b]">
                      <AvatarImage src={activeConvo.other_user.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#ffd166] text-[#2b2b2b] font-bold text-sm">
                        {activeConvo.other_user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-bold text-[#2b2b2b] font-kalam leading-tight">{activeConvo.other_user.full_name}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4 bg-[#fdfbf7]">
                {loadingMessages ? (
                  <ChatMessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-[15px] font-bold text-[#777]">
                      No messages yet. Say hello! 👋
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3" role="log" aria-label="Messages" aria-live="polite">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 border-2 border-[#2b2b2b] shadow-[2px_2px_0px_0px_#2b2b2b] ${
                              isMine
                                ? "bg-[#ff6b5c] text-white rounded-br-sm"
                                : "bg-white text-[#2b2b2b] rounded-bl-sm"
                            }`}
                          >
                            <p className="text-[15px] font-medium whitespace-pre-wrap break-words">{msg.content}</p>
                            <div
                              className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${
                                isMine ? "justify-end text-white/80" : "text-[#777]"
                              }`}
                            >
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              {isMine && (
                                msg.read_at
                                  ? <CheckCheck className="h-3 w-3" strokeWidth={2.5} aria-label="Read" />
                                  : <Check className="h-3 w-3" strokeWidth={2.5} aria-label="Sent" />
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
              <form onSubmit={handleSend} className="border-t-2 border-[#2b2b2b] p-3 bg-white">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength={2000}
                    className="flex-1 h-11 border-2 border-[#2b2b2b] rounded-xl shadow-[2px_2px_0px_0px_#2b2b2b] focus-visible:ring-0 focus-visible:border-[#ff6b5c] font-medium text-[15px]"
                    disabled={sending}
                    aria-label="Message input"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-11 w-11 shrink-0 bg-[#90be6d] hover:bg-[#7aa659] text-white border-2 border-[#2b2b2b] shadow-[2px_2px_0px_0px_#2b2b2b] rounded-xl transition-all hover:-translate-y-0.5"
                    disabled={!newMessage.trim() || sending}
                    aria-label="Send message"
                  >
                    <Send className="h-5 w-5" strokeWidth={2.5} />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
