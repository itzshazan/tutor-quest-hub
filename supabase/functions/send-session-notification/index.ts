import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  session_id: string;
  event_type: "booked" | "confirmed" | "declined" | "paid" | "completed" | "cancelled";
}

const SUBJECT_MAP: Record<string, string> = {
  booked: "📚 New Session Request",
  confirmed: "✅ Session Confirmed",
  declined: "❌ Session Declined",
  paid: "💰 Payment Received",
  completed: "🎉 Session Completed",
  cancelled: "🚫 Session Cancelled",
};

function buildEmailHtml(
  event_type: string,
  recipientName: string,
  otherName: string,
  subject: string,
  sessionDate: string,
  startTime: string,
  endTime: string,
  isTutor: boolean
): string {
  const messages: Record<string, string> = {
    booked: isTutor
      ? `<strong>${otherName}</strong> has requested a tutoring session with you.`
      : `Your session request with <strong>${otherName}</strong> has been sent. You'll be notified when they respond.`,
    confirmed: isTutor
      ? `You confirmed the session with <strong>${otherName}</strong>.`
      : `Great news! <strong>${otherName}</strong> has confirmed your session.`,
    declined: isTutor
      ? `You declined the session with <strong>${otherName}</strong>.`
      : `Unfortunately, <strong>${otherName}</strong> was unable to accept your session request.`,
    paid: isTutor
      ? `<strong>${otherName}</strong> has completed payment for your upcoming session. The funds are held in escrow until the session is completed.`
      : `Your payment for the session with <strong>${otherName}</strong> has been received and is held securely.`,
    completed: isTutor
      ? `Your session with <strong>${otherName}</strong> is complete! Payment has been released to you.`
      : `Your session with <strong>${otherName}</strong> is complete! We hope it was helpful.`,
    cancelled: `The session with <strong>${otherName}</strong> has been cancelled.`,
  };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">Tutor Quest</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#333;font-size:16px;">Hi ${recipientName},</p>
      <h2 style="margin:16px 0;color:#1a1a2e;font-size:18px;">${SUBJECT_MAP[event_type]}</h2>
      <p style="color:#555;line-height:1.6;">${messages[event_type] || ""}</p>
      <div style="margin:24px 0;padding:16px;background:#f8f9fa;border-radius:8px;border-left:4px solid #6c63ff;">
        <p style="margin:0 0 4px;font-size:14px;color:#888;">Session Details</p>
        <p style="margin:4px 0;font-size:15px;color:#333;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin:4px 0;font-size:15px;color:#333;"><strong>Date:</strong> ${sessionDate}</p>
        <p style="margin:4px 0;font-size:15px;color:#333;"><strong>Time:</strong> ${startTime} – ${endTime}</p>
      </div>
      <a href="https://id-preview--0899f252-419d-46a9-9760-b90235af1dbc.lovable.app/sessions" style="display:inline-block;padding:12px 28px;background:#6c63ff;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">View Sessions</a>
    </div>
    <div style="padding:16px 32px;background:#f8f9fa;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">Tutor Quest — Connecting students with great tutors</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id, event_type }: NotificationPayload = await req.json();
    if (!session_id || !event_type) throw new Error("session_id and event_type are required");

    // Fetch session
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();
    if (!session) throw new Error("Session not found");

    // Fetch both profiles and emails
    const [{ data: studentProfile }, { data: tutorProfile }, { data: studentAuth }, { data: tutorAuth }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name").eq("user_id", session.student_id).single(),
      supabaseAdmin.from("profiles").select("full_name").eq("user_id", session.tutor_id).single(),
      supabaseAdmin.auth.admin.getUserById(session.student_id),
      supabaseAdmin.auth.admin.getUserById(session.tutor_id),
    ]);

    const studentName = studentProfile?.full_name || "Student";
    const tutorName = tutorProfile?.full_name || "Tutor";
    const studentEmail = studentAuth?.user?.email;
    const tutorEmail = tutorAuth?.user?.email;

    // Determine recipients based on event type
    const recipients: Array<{ email: string; name: string; isTutor: boolean; otherName: string }> = [];

    if (event_type === "booked") {
      // Notify tutor about new booking
      if (tutorEmail) recipients.push({ email: tutorEmail, name: tutorName, isTutor: true, otherName: studentName });
    } else if (event_type === "confirmed" || event_type === "declined") {
      // Notify student about tutor's response
      if (studentEmail) recipients.push({ email: studentEmail, name: studentName, isTutor: false, otherName: tutorName });
    } else if (event_type === "paid") {
      // Notify tutor about payment
      if (tutorEmail) recipients.push({ email: tutorEmail, name: tutorName, isTutor: true, otherName: studentName });
      // Also confirm to student
      if (studentEmail) recipients.push({ email: studentEmail, name: studentName, isTutor: false, otherName: tutorName });
    } else if (event_type === "completed") {
      // Notify both
      if (tutorEmail) recipients.push({ email: tutorEmail, name: tutorName, isTutor: true, otherName: studentName });
      if (studentEmail) recipients.push({ email: studentEmail, name: studentName, isTutor: false, otherName: tutorName });
    } else if (event_type === "cancelled") {
      // Notify both
      if (tutorEmail) recipients.push({ email: tutorEmail, name: tutorName, isTutor: true, otherName: studentName });
      if (studentEmail) recipients.push({ email: studentEmail, name: studentName, isTutor: false, otherName: tutorName });
    }

    // Send emails
    const results = await Promise.all(
      recipients.map(async (r) => {
        const html = buildEmailHtml(
          event_type, r.name, r.otherName,
          session.subject, session.session_date, session.start_time, session.end_time,
          r.isTutor
        );

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Tutor Quest <onboarding@resend.dev>",
            to: [r.email],
            subject: `${SUBJECT_MAP[event_type]} — ${session.subject}`,
            html,
          }),
        });

        const data = await res.json();
        return { email: r.email, success: res.ok, data };
      })
    );

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
