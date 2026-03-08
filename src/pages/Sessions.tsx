import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const [searchParams] = useSearchParams();
  const tutorIdParam = searchParams.get("tutor");
  const tutorSubjectParam = searchParams.get("subject");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showBooking, setShowBooking] = useState(!!tutorIdParam);
  const [tutorName, setTutorName] = useState("");

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

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sessions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
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
        supabase.functions.invoke("send-session-notification", {
          body: { session_id: inserted.id, event_type: "booked" },
        }).catch(console.error);
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
      // Send notification
      const eventMap: Record<string, string> = { confirmed: "confirmed", declined: "declined", cancelled: "cancelled" };
      if (eventMap[status]) {
        supabase.functions.invoke("send-session-notification", {
          body: { session_id: sessionId, event_type: eventMap[status] },
        }).catch(console.error);
      }
    }
  };

  const userRole = user?.user_metadata?.role;
  const upcoming = sessions.filter((s) => ["pending", "confirmed"].includes(s.status));
  const past = sessions.filter((s) => ["completed", "cancelled", "declined"].includes(s.status));

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <GraduationCap className="h-6 w-6" /> Tutor Quest
          </Link>
          <span className="text-sm text-muted-foreground">— Sessions</span>
        </div>
      </div>

      <div className="container max-w-3xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/payments")} className="gap-1.5">
              <IndianRupee className="h-4 w-4" /> Payment History
            </Button>
            {userRole === "student" && !showBooking && (
              <Button size="sm" onClick={() => navigate("/find-tutors")} className="gap-1.5">
                <Plus className="h-4 w-4" /> Book a Session
              </Button>
            )}
          </div>
        </div>

        {/* Booking Form */}
        {showBooking && tutorIdParam && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Book a Session with {tutorName}
              </CardTitle>
              <CardDescription>Choose a date, time, and subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Subject */}
              <div className="space-y-2">
                <Label>Subject</Label>
                {tutorSubjects.length > 0 ? (
                  <Select value={bookSubject} onValueChange={setBookSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {tutorSubjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading subjects...</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !bookDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bookDate ? format(bookDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={bookDate}
                      onSelect={setBookDate}
                      disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              {bookDate && availableStartTimes.length === 0 ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  The tutor is not available on {format(bookDate, "EEEE")}. Please select a different date.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select value={bookStart} onValueChange={(v) => { setBookStart(v); setBookEnd(""); }}>
                      <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                      <SelectContent>
                        {availableStartTimes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select value={bookEnd} onValueChange={setBookEnd} disabled={!bookStart}>
                      <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
                      <SelectContent>
                        {availableEndTimes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any specific topics or requests..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleBook} disabled={booking || !bookDate || !bookStart || !bookEnd || !bookSubject}>
                  {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                  {booking ? "Booking..." : "Request Session"}
                </Button>
                <Button variant="outline" onClick={() => { setShowBooking(false); navigate("/sessions", { replace: true }); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions View Toggle */}
        <Tabs defaultValue="list">
          <div className="mb-4 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list" className="gap-1.5">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <LayoutGrid className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list">
            {/* Sessions List */}
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">
                  Upcoming {upcoming.length > 0 && `(${upcoming.length})`}
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past {past.length > 0 && `(${past.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {loadingSessions ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                  </div>
                ) : upcoming.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 font-medium text-muted-foreground">No upcoming sessions</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {userRole === "student" ? "Find a tutor to book your first session!" : "Sessions will appear here when students book with you."}
                    </p>
                    {userRole === "student" && (
                      <Button size="sm" asChild className="mt-4">
                        <Link to="/find-tutors">Find Tutors</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((s) => (
                      <SessionCard key={s.id} session={s} userId={user!.id} userRole={userRole} onStatusChange={updateStatus} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past">
                {past.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 font-medium text-muted-foreground">No past sessions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {past.map((s) => (
                      <SessionCard key={s.id} session={s} userId={user!.id} userRole={userRole} onStatusChange={updateStatus} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="p-6">
                <SessionCalendar 
                  sessions={sessions.map(s => ({
                    ...s,
                    other_user: s.other_user || undefined,
                  }))} 
                  onDateSelect={(date) => console.log("Selected:", date)}
                  selectedDate={new Date()}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const SessionCard = ({
  session,
  userId,
  userRole,
  onStatusChange,
}: {
  session: Session;
  userId: string;
  userRole: string;
  onStatusChange: (id: string, status: string) => void;
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

  const handlePay = async () => {
    setPayLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-session-payment", {
        body: { session_id: session.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message || "Could not initiate payment", variant: "destructive" });
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
      // Trigger reload via realtime
    } catch (err: any) {
      toast({ title: "Capture failed", description: err.message || "Could not capture payment", variant: "destructive" });
    }
    setCaptureLoading(false);
  };

  const paymentStatus = session.payment?.payment_status;
  const needsPayment = !isTutor && session.status === "confirmed" && (!paymentStatus || paymentStatus === "failed");
  const canCapture = session.status === "confirmed" && paymentStatus === "pending";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={session.other_user?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{session.other_user?.full_name}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {session.subject}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> {format(new Date(session.session_date), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
              </span>
            </div>
            {session.notes && (
              <p className="mt-1 text-xs text-muted-foreground italic">"{session.notes}"</p>
            )}
            {/* Payment info */}
            {session.payment && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <IndianRupee className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">₹{session.payment.amount}</span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", 
                  paymentStatus === "completed" && "border-primary/30 bg-primary/10 text-primary",
                  paymentStatus === "pending" && "border-accent/30 bg-accent/10 text-accent-foreground",
                  paymentStatus === "refunded" && "border-destructive/30 bg-destructive/10 text-destructive",
                )}>
                  {paymentStatus === "pending" ? "Payment held" : paymentStatus}
                </Badge>
                {isTutor && paymentStatus === "completed" && (
                  <span className="text-muted-foreground">Earned: ₹{session.payment.tutor_earnings}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[session.status] || "")}>
            {session.status}
          </Badge>

          {/* Student: Pay for confirmed session */}
          {needsPayment && (
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={handlePay} disabled={payLoading}>
              {payLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
              Pay Now
            </Button>
          )}

          {/* Tutor actions for pending sessions */}
          {isTutor && session.status === "pending" && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="default" className="h-7 gap-1 text-xs" onClick={() => onStatusChange(session.id, "confirmed")}>
                <Check className="h-3 w-3" /> Accept
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onStatusChange(session.id, "declined")}>
                <XIcon className="h-3 w-3" /> Decline
              </Button>
            </div>
          )}

          {/* Complete session & capture payment */}
          {isTutor && canCapture && (
            <Button size="sm" variant="secondary" className="h-7 gap-1 text-xs" onClick={handleCapture} disabled={captureLoading}>
              {captureLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Complete & Release Payment
            </Button>
          )}

          {/* Tutor can mark as completed (no payment) */}
          {isTutor && session.status === "confirmed" && !paymentStatus && (
            <Button size="sm" variant="secondary" className="h-7 gap-1 text-xs" onClick={() => onStatusChange(session.id, "completed")}>
              <Check className="h-3 w-3" /> Complete
            </Button>
          )}

          {/* Student can cancel pending/confirmed */}
          {!isTutor && ["pending", "confirmed"].includes(session.status) && (
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onStatusChange(session.id, "cancelled")}>
              <XIcon className="h-3 w-3" /> Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Sessions;
