import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, CalendarIcon, Clock, Plus, Check, X as XIcon,
  ArrowLeft, Loader2, BookOpen, MapPin, CreditCard, IndianRupee, LayoutGrid, List,
} from "lucide-react";
import { format, startOfDay, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { SessionCalendar } from "@/components/SessionCalendar";

const TIME_OPTIONS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground border-accent",
  confirmed: "bg-secondary/20 text-secondary-foreground border-secondary",
  completed: "bg-primary/20 text-primary-foreground border-primary",
  cancelled: "bg-destructive/20 text-destructive-foreground border-destructive",
  declined: "bg-muted text-muted-foreground border-muted",
};

interface Session {
  id: string;
  student_id: string;
  tutor_id: string;
  subject: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
  created_at: string;
  other_user?: { full_name: string; avatar_url: string | null };
  payment?: { id: string; payment_status: string; amount: number; tutor_earnings: number; platform_commission: number } | null;
}

const Sessions = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tutorIdParam = searchParams.get("tutor");
  const tutorSubjectParam = searchParams.get("subject");
  const paymentStatus = searchParams.get("payment");
  const paymentSessionId = searchParams.get("session_id");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showBooking, setShowBooking] = useState(!!tutorIdParam);
  const [tutorName, setTutorName] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  const sendSessionNotification = async (sessionId: string, eventType: string, fallbackTitle: string) => {
    const { data, error } = await supabase.functions.invoke("send-session-notification", {
      body: { session_id: sessionId, event_type: eventType },
    });
  
    if (error) {
      console.error("send-session-notification failed:", error);
      toast({
        title: fallbackTitle,
        description: "Status changed, but email delivery failed. Please verify Resend configuration.",
        variant: "destructive",
      });
      return;
    }
  
    const payload = data as { success?: boolean; failedEmails?: Array<{ email: string; emailError?: string | null }> } | null;
    if (payload?.success === false || (payload?.failedEmails?.length ?? 0) > 0) {
      const failedCount = payload?.failedEmails?.length ?? 0;
      const failedEmail = payload?.failedEmails?.[0]?.email;
      const failedReason = payload?.failedEmails?.[0]?.emailError;
  
      toast({
        title: fallbackTitle,
        description:
          failedCount > 0
            ? `Status changed, but email to ${failedEmail || "recipient"} failed${failedReason ? `: ${failedReason}` : ""}.`
            : "Status changed, but email delivery may have failed.",
        variant: "destructive",
      });
    }
  };
  // Booking form state
  const [bookDate, setBookDate] = useState<Date>();
  const [bookStart, setBookStart] = useState("");
  const [bookEnd, setBookEnd] = useState("");
  const [bookSubject, setBookSubject] = useState(tutorSubjectParam || "");
  const [bookNotes, setBookNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([]);
  const [tutorAvailability, setTutorAvailability] = useState<{ day_of_week: string; start_time: string; end_time: string }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Load tutor info and availability if booking
  useEffect(() => {
    if (!tutorIdParam) return;
    const load = async () => {
      const [{ data: profile }, { data: tp }, { data: availability }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", tutorIdParam).single(),
        supabase.from("tutor_profiles").select("subject, subjects").eq("user_id", tutorIdParam).single(),
        supabase.from("tutor_availability").select("day_of_week, start_time, end_time").eq("tutor_id", tutorIdParam),
      ]);
      if (profile) setTutorName(profile.full_name);
      if (tp) {
        const subs = tp.subjects?.length ? tp.subjects : tp.subject ? [tp.subject] : [];
        setTutorSubjects(subs);
        if (!bookSubject && subs.length > 0) setBookSubject(subs[0]);
      }
      if (availability) setTutorAvailability(availability);
    };
    load();
  }, [tutorIdParam]);

  // Get available time slots for the selected date based on tutor's availability
  const getAvailableTimeSlots = () => {
    if (!bookDate || tutorAvailability.length === 0) return TIME_OPTIONS;
    
    const dayName = format(bookDate, "EEEE"); // e.g., "Monday"
    const dayAvailability = tutorAvailability.filter((a) => a.day_of_week.toLowerCase() === dayName.toLowerCase());
    
    if (dayAvailability.length === 0) return []; // Tutor not available on this day
    
    // Filter TIME_OPTIONS to only include slots within tutor's available windows
    return TIME_OPTIONS.filter((time) => {
      return dayAvailability.some((slot) => {
        return time >= slot.start_time.slice(0, 5) && time < slot.end_time.slice(0, 5);
      });
    });
  };

  const availableStartTimes = getAvailableTimeSlots();
  const availableEndTimes = availableStartTimes.filter((t) => t > bookStart);

  // Load sessions
  const loadSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
      .order("session_date", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (s) => {
          const otherId = s.student_id === user.id ? s.tutor_id : s.student_id;
          const [{ data: profile }, { data: payment }] = await Promise.all([
            supabase.from("profiles").select("full_name, avatar_url").eq("user_id", otherId).single(),
            supabase.from("payments").select("id, payment_status, amount, tutor_earnings, platform_commission").eq("session_id", s.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          ]);
          return { ...s, other_user: profile || { full_name: "Unknown", avatar_url: null }, payment };
        })
      );
      setSessions(enriched as Session[]);
    }
    setLoadingSessions(false);
  };

  useEffect(() => { loadSessions(); }, [user]);

  // Handle payment success/cancel from Stripe redirect
  useEffect(() => {
    if (paymentStatus === "success") {
      toast({ 
        title: "Payment successful!", 
        description: "Your payment is being processed. The session will be updated shortly." 
      });
      // Clear URL params
      setSearchParams({});
      // Reload sessions to get updated payment status
      loadSessions();
    } else if (paymentStatus === "cancelled") {
      toast({ 
        title: "Payment cancelled", 
        description: "You can try again when ready.",
        variant: "destructive" 
      });
      // Clear URL params
      setSearchParams({});
    }
  }, [paymentStatus]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sessions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        loadSessions();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        loadSessions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleBook = async () => {
    if (!user || !tutorIdParam || !bookDate || !bookStart || !bookEnd || !bookSubject) return;
    setBooking(true);

    const sessionDateStr = format(bookDate, "yyyy-MM-dd");

    // Check for time conflicts with existing sessions
    const { data: existingSessions, error: conflictError } = await supabase
      .from("sessions")
      .select("id, start_time, end_time")
      .eq("tutor_id", tutorIdParam)
      .eq("session_date", sessionDateStr)
      .in("status", ["pending", "confirmed"]);

    if (conflictError) {
      toast({ title: "Error checking availability", description: conflictError.message, variant: "destructive" });
      setBooking(false);
      return;
    }

    // Check for time overlap: conflict exists when existing.start < new.end AND existing.end > new.start
    const hasConflict = existingSessions?.some((existing) => {
      return existing.start_time < bookEnd && existing.end_time > bookStart;
    });

    if (hasConflict) {
      toast({
        title: "Time slot unavailable",
        description: "The tutor already has a session booked during this time. Please choose a different time.",
        variant: "destructive",
      });
      setBooking(false);
      return;
    }

    const { data: inserted, error } = await supabase.from("sessions").insert({
      student_id: user.id,
      tutor_id: tutorIdParam,
      subject: bookSubject,
      session_date: sessionDateStr,
      start_time: bookStart,
      end_time: bookEnd,
      notes: bookNotes.trim(),
    }).select("id").single();

    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Session requested!", description: `Waiting for ${tutorName} to confirm.` });
      setShowBooking(false);
      setBookDate(undefined);
      setBookStart("");
      setBookEnd("");
      setBookNotes("");
      await loadSessions();
      // Send notification (fire and forget)
      if (inserted?.id) {
        await sendSessionNotification(inserted.id, "booked", "Session requested, email failed");
      }
    }
    setBooking(false);
  };

  const updateStatus = async (sessionId: string, status: string) => {
    const { error } = await supabase
      .from("sessions")
      .update({ status })
      .eq("id", sessionId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Session ${status}` });
      await loadSessions();
      // Send notification
      const eventMap: Record<string, string> = { confirmed: "confirmed", declined: "declined", cancelled: "cancelled" };
      if (eventMap[status]) {
        await sendSessionNotification(sessionId, eventMap[status], `Session ${status}, email failed`);
      }
    }
  };

  const userRole = user?.user_metadata?.role;
  const upcoming = sessions.filter((s) => ["pending", "confirmed"].includes(s.status));
  const past = sessions.filter((s) => ["completed", "cancelled", "declined"].includes(s.status));

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ee]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff5a5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout role={userRole || "student"} title={<span className="text-hd-ink/60 font-medium">— Sessions</span>}>
      {/* Paper plane doodle top right */}
      <div className="absolute top-4 right-12 opacity-80 pointer-events-none hidden md:block z-0">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" stroke="#2d2d2d" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 6">
          <path d="M10,70 Q50,80 90,30" />
          <polygon points="90,30 85,25 95,20 93,32" fill="white" stroke="#2d2d2d" strokeDasharray="none" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Scattered background dots/shapes */}
      <div className="absolute right-20 top-40 w-4 h-4 rounded-full bg-[#ffd166] border border-hd-ink hidden lg:block pointer-events-none"></div>
      <div className="absolute right-10 top-60 w-3 h-3 rounded-full bg-[#ffb4a2] border border-hd-ink hidden lg:block pointer-events-none"></div>
      <div className="absolute right-32 bottom-20 w-6 h-6 rounded-full bg-[#90be6d] border border-hd-ink hidden lg:block pointer-events-none"></div>
      <div className="absolute left-10 bottom-32 opacity-50 pointer-events-none hidden lg:block">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d2d2d" strokeWidth="2"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z" fill="#ffd166"/></svg>
      </div>

      <div className="container max-w-4xl h-full flex flex-col relative z-10 py-2">
        <div className="mb-3 flex items-center justify-between shrink-0">
          <button onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/")} className="inline-flex items-center gap-2 font-kalam font-bold text-hd-ink hover:text-[#ff5a5a] transition-colors text-lg">
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          <div className="flex items-center gap-4">
            <Button size="sm" variant="outline" onClick={() => navigate("/payments")} className="bg-white text-hd-ink hover:text-hd-ink hover:bg-[#fdfbf7] border-[3px] border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[6px_6px_0px_0px_#2d2d2d] rounded-xl font-bold h-11 px-5 transition-all hover:-translate-y-1">
              <IndianRupee className="mr-2 h-4 w-4" /> Payment History
            </Button>
            {userRole === "student" && !showBooking && (
              <Button size="sm" variant="outline" onClick={() => navigate("/find-tutors")} className="bg-white text-hd-ink hover:text-hd-ink hover:bg-[#fdfbf7] border-[3px] border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[6px_6px_0px_0px_#2d2d2d] rounded-xl font-bold h-11 px-5 transition-all hover:-translate-y-1">
                <Plus className="mr-2 h-5 w-5" /> Book a Session
              </Button>
            )}
          </div>
        </div>

        {/* Booking Form */}
        {showBooking && tutorIdParam && (
          <Card className="mb-8 border-[3px] border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-[#fdfbf7] border-b-2 border-hd-ink border-dashed">
              <CardTitle className="flex items-center gap-2 font-kalam text-2xl text-hd-ink">
                <CalendarIcon className="h-6 w-6 text-[#ff5a5a]" />
                Book a Session with {tutorName}
              </CardTitle>
              <CardDescription className="font-medium text-hd-ink/70">Choose a date, time, and subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Subject */}
              <div className="space-y-2">
                <Label className="font-bold text-hd-ink">Subject</Label>
                {tutorSubjects.length > 0 ? (
                  <Select value={bookSubject} onValueChange={setBookSubject}>
                    <SelectTrigger className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] bg-white h-11"><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent className="border-2 border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] rounded-xl">
                      {tutorSubjects.map((s) => (
                        <SelectItem key={s} value={s} className="font-medium">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium text-hd-ink/60">Loading subjects...</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="font-bold text-hd-ink">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-bold border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl h-11", !bookDate && "text-hd-ink/50")}>
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {bookDate ? format(bookDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-2 border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] rounded-xl overflow-hidden" align="start">
                    <Calendar
                      mode="single"
                      selected={bookDate}
                      onSelect={setBookDate}
                      disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto bg-white")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              {bookDate && availableStartTimes.length === 0 ? (
                <div className="rounded-xl border-2 border-[#ff5a5a] bg-[#ffebed] p-4 text-sm font-bold text-[#d32f2f] shadow-[2px_2px_0px_0px_#2d2d2d]">
                  The tutor is not available on {format(bookDate, "EEEE")}. Please select a different date.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-hd-ink">Start Time</Label>
                    <Select value={bookStart} onValueChange={(v) => { setBookStart(v); setBookEnd(""); }}>
                      <SelectTrigger className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] bg-white h-11"><SelectValue placeholder="Start" /></SelectTrigger>
                      <SelectContent className="border-2 border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] rounded-xl">
                        {availableStartTimes.map((t) => (
                          <SelectItem key={t} value={t} className="font-medium">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-hd-ink">End Time</Label>
                    <Select value={bookEnd} onValueChange={setBookEnd} disabled={!bookStart}>
                      <SelectTrigger className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] bg-white h-11"><SelectValue placeholder="End" /></SelectTrigger>
                      <SelectContent className="border-2 border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] rounded-xl">
                        {availableEndTimes.map((t) => (
                          <SelectItem key={t} value={t} className="font-medium">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="font-bold text-hd-ink">Notes (optional)</Label>
                <Textarea
                  placeholder="Any specific topics or requests..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="border-2 border-hd-ink rounded-xl shadow-[2px_2px_0px_0px_#2d2d2d] bg-white font-medium resize-none focus-visible:ring-0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleBook} disabled={booking || !bookDate || !bookStart || !bookEnd || !bookSubject} className="bg-[#90be6d] text-white hover:bg-[#78a258] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold px-6 h-11">
                  {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                  {booking ? "Booking..." : "Request Session"}
                </Button>
                <Button variant="outline" onClick={() => { setShowBooking(false); navigate("/sessions", { replace: true }); }} className="bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl font-bold px-6 h-11">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions View Toggle */}
        <Tabs defaultValue="list" className="w-full flex-1 flex flex-col min-h-0">
          <div className="mb-3 shrink-0">
            <TabsList className="bg-transparent h-auto p-0 flex gap-4 border-none self-start justify-start">
              <TabsTrigger value="list" className="bg-white border-2 border-hd-ink/30 data-[state=active]:border-[3px] data-[state=active]:border-hd-ink data-[state=active]:shadow-[4px_4px_0px_0px_#2d2d2d] data-[state=active]:translate-y-[-2px] rounded-xl font-bold h-11 px-6 data-[state=active]:bg-white transition-all text-hd-ink">
                <List className="mr-2 h-5 w-5" /> List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="bg-white border-2 border-hd-ink/30 data-[state=active]:border-[3px] data-[state=active]:border-hd-ink data-[state=active]:shadow-[4px_4px_0px_0px_#2d2d2d] data-[state=active]:translate-y-[-2px] rounded-xl font-bold h-11 px-6 data-[state=active]:bg-white transition-all text-hd-ink">
                <LayoutGrid className="mr-2 h-5 w-5" /> Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0 data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            {/* Sessions List */}
            <Tabs defaultValue="upcoming" className="w-full flex-1 flex flex-col min-h-0">
              <TabsList className="bg-[#f0ece6] h-auto p-1.5 flex gap-1 mb-3 border-none shrink-0 self-start justify-start rounded-2xl w-fit">
                <TabsTrigger value="upcoming" className="border-none shadow-none data-[state=active]:shadow-[0px_2px_8px_rgba(0,0,0,0.08)] data-[state=active]:bg-white rounded-xl font-bold h-10 px-6 text-hd-ink/60 data-[state=active]:text-hd-ink transition-all">
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="past" className="border-none shadow-none data-[state=active]:shadow-[0px_2px_8px_rgba(0,0,0,0.08)] data-[state=active]:bg-white rounded-xl font-bold h-10 px-6 text-hd-ink/60 data-[state=active]:text-hd-ink transition-all">
                  Past ({past.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-0 flex-1 overflow-y-auto pr-2 pb-4">
                {loadingSessions ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl border-[3px] border-hd-ink/20" />)}
                  </div>
                ) : upcoming.length === 0 ? (
                  <div className="flex flex-col items-center py-2 text-center relative max-w-lg mx-auto">
                    {/* Calendar Illustration */}
                    <div className="relative mb-2">
                      <img src="/sessions-empty.png" alt="No sessions" className="w-[200px] h-auto object-contain" />
                    </div>
                    <h2 className="font-kalam text-2xl font-bold text-hd-ink mb-1">No upcoming sessions</h2>
                    <p className="text-hd-ink/80 font-medium text-sm">
                      {userRole === "student" ? "Find a tutor to book your first session!" : "Sessions will appear here when students book with you."}
                    </p>
                    {userRole === "student" && (
                      <Button asChild className="mt-3 bg-[#ff5a5a] text-white hover:bg-[#e04848] border-[3px] border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] rounded-xl font-bold px-6 h-10 text-sm hover:-translate-y-1 transition-all">
                        <Link to="/find-tutors">Find Tutors</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcoming.map((s) => (
                      <SessionCard key={s.id} session={s} userId={user!.id} userRole={userRole} onStatusChange={updateStatus} onReload={loadSessions} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-0 flex-1 overflow-y-auto pr-2 pb-4">
                {past.length === 0 ? (
                  <div className="flex flex-col items-center py-4 text-center">
                    <Clock className="h-10 w-10 text-hd-ink/30 mb-3" />
                    <h2 className="font-kalam text-xl font-bold text-hd-ink mb-2">No past sessions</h2>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {past.map((s) => (
                      <SessionCard key={s.id} session={s} userId={user!.id} userRole={userRole} onStatusChange={updateStatus} onReload={loadSessions} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0 data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 overflow-y-auto pr-2 pb-4">
            <Card className="border-[3px] border-hd-ink rounded-2xl shadow-[6px_6px_0px_0px_#2d2d2d] bg-white overflow-hidden">
              <CardContent className="p-6">
                <SessionCalendar 
                  sessions={sessions.map(s => ({
                    ...s,
                  other_user: s.other_user || undefined,
                }))} 
                onDateSelect={setSelectedCalendarDate}
                selectedDate={selectedCalendarDate}
              />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const SessionCard = ({
  session,
  userId,
  userRole,
  onStatusChange,
  onReload,
}: {
  session: Session;
  userId: string;
  userRole: string;
  onStatusChange: (id: string, status: string) => void;
  onReload: () => void;
}) => {
  const isTutor = session.tutor_id === userId;
  const { toast } = useToast();
  const [payLoading, setPayLoading] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);

  const initials = session.other_user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const getPaymentErrorMessage = async (err: any) => {
    if (err?.context) {
      try {
        const payload = await err.context.json();
        const serverMessage = payload?.error || payload?.message || payload?.details;
        if (typeof serverMessage === "string" && serverMessage.trim()) {
          return serverMessage;
        }
      } catch {
        // Ignore non-JSON function responses
      }
    }

    if (typeof err?.message === "string" && err.message.trim()) {
      const isGenericHttpMessage = err.message.toLowerCase().includes("non-2xx");
      if (!isGenericHttpMessage) {
        return err.message;
      }
    }

    return "Could not initiate payment";
  };

  const handlePay = async () => {
    setPayLoading(true);
    try {
      console.log("Invoking payment function for session:", session.id);
      
      // Get current session to ensure we have a valid auth token
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error("You must be logged in to make a payment");
      }
      
      console.log("Auth session found, access token:", authSession.access_token.substring(0, 20) + "...");
      
      const { data, error } = await supabase.functions.invoke("create-session-payment", {
        body: { session_id: session.id },
      });
      
      console.log("Payment response:", { data, error });
      
      if (error) {
        console.error("Payment error:", error);
        throw error;
      }
      
      if (data?.error) {
        console.error("Payment data error:", data.error);
        throw new Error(data.error);
      }
      
      if (data?.url) {
        console.log("Redirecting to:", data.url);
        window.open(data.url, "_blank");
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      const description = await getPaymentErrorMessage(err);
      toast({ 
        title: "Payment failed", 
        description,
        variant: "destructive" 
      });
    }
    setPayLoading(false);
  };

  const handleCapture = async () => {
    setCaptureLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("capture-payment", {
        body: { session_id: session.id },
      });
      if (error) throw error;
      toast({ title: "Session completed!", description: "Payment has been released to the tutor." });
      onReload();
    } catch (err: any) {
      const description = await getPaymentErrorMessage(err);
      toast({ title: "Capture failed", description, variant: "destructive" });
    }
    setCaptureLoading(false);
  };

  const paymentStatus = session.payment?.payment_status;
  const needsPayment = !isTutor && session.status === "confirmed" && (!paymentStatus || paymentStatus === "failed");
  const canCapture = session.status === "confirmed" && paymentStatus === "pending";

  return (
    <Card className="border-[3px] border-hd-ink shadow-[4px_4px_0px_0px_#2d2d2d] rounded-2xl bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#2d2d2d] transition-all duration-300">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0 border-[3px] border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d]">
            <AvatarImage src={session.other_user?.avatar_url || undefined} />
            <AvatarFallback className="bg-[#ffd166] text-hd-ink font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-bold text-hd-ink font-kalam leading-tight">{session.other_user?.full_name}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-hd-ink/70 mt-1">
              <span className="flex items-center gap-1 bg-hd-muted px-2 py-0.5 rounded-md border border-hd-ink/20">
                <BookOpen className="h-3.5 w-3.5" /> {session.subject}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" /> {format(new Date(session.session_date), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
              </span>
            </div>
            {session.notes && (
              <p className="mt-2 text-sm text-hd-ink/80 italic font-medium bg-[#fdfbf7] p-2 rounded-lg border border-hd-ink border-dashed">"{session.notes}"</p>
            )}
            {/* Payment info */}
            {session.payment && (
              <div className="mt-2 flex items-center gap-2 text-sm font-bold">
                <IndianRupee className="h-3.5 w-3.5 text-hd-ink/70" />
                <span className="text-hd-ink">₹{session.payment.amount}</span>
                <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5 border-2", 
                  paymentStatus === "completed" && "border-[#90be6d] bg-[#eef6ea] text-[#4a7a2a]",
                  paymentStatus === "pending" && "border-[#ffd166] bg-[#fff9c4] text-[#d4a017]",
                  paymentStatus === "refunded" && "border-[#ff5a5a] bg-[#ffebed] text-[#d32f2f]",
                )}>
                  {paymentStatus === "pending" ? "Payment held" : paymentStatus}
                </Badge>
                {isTutor && paymentStatus === "completed" && (
                  <span className="text-hd-ink/60">Earned: ₹{session.payment.tutor_earnings}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge className={cn("text-xs font-bold px-3 py-1 border-2 shadow-[2px_2px_0px_0px_#2d2d2d]", STATUS_COLORS[session.status] || "bg-white text-hd-ink border-hd-ink")}>
            {session.status}
          </Badge>

          {/* Student: Pay for confirmed session */}
          {needsPayment && (
            <Button size="sm" className="h-9 px-4 font-bold bg-[#ff5a5a] text-white hover:bg-[#e04848] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl" onClick={handlePay} disabled={payLoading}>
              {payLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Pay Now
            </Button>
          )}

          {/* Tutor actions for pending sessions */}
          {isTutor && session.status === "pending" && (
            <div className="flex gap-2">
              <Button size="sm" className="h-9 px-4 font-bold bg-[#90be6d] text-white hover:bg-[#78a258] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl" onClick={() => onStatusChange(session.id, "confirmed")}>
                <Check className="mr-2 h-4 w-4" /> Accept
              </Button>
              <Button size="sm" variant="outline" className="h-9 px-4 font-bold bg-white text-hd-ink hover:bg-red-50 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl" onClick={() => onStatusChange(session.id, "declined")}>
                <XIcon className="mr-2 h-4 w-4" /> Decline
              </Button>
            </div>
          )}

          {/* Complete session & capture payment */}
          {isTutor && canCapture && (
            <Button size="sm" className="h-9 px-4 font-bold bg-[#ffd166] text-hd-ink hover:bg-[#e5bc5c] border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl" onClick={handleCapture} disabled={captureLoading}>
              {captureLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Complete & Release Payment
            </Button>
          )}

          {/* Tutor can mark as completed (no payment) */}
          {isTutor && session.status === "confirmed" && !paymentStatus && (
            <Button size="sm" className="h-9 px-4 font-bold bg-white text-hd-ink hover:bg-hd-muted border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl" onClick={() => onStatusChange(session.id, "completed")}>
              <Check className="mr-2 h-4 w-4" /> Complete
            </Button>
          )}

          {/* Student can cancel pending/confirmed */}
          {!isTutor && ["pending", "confirmed"].includes(session.status) && (
            <Button size="sm" variant="outline" className="h-9 px-4 font-bold bg-white text-hd-ink hover:bg-red-50 border-2 border-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl" onClick={() => onStatusChange(session.id, "cancelled")}>
              <XIcon className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Sessions;
