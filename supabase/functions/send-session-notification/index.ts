import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  getSessionCreatedEmail,
  getSessionConfirmedEmail,
  getSessionCanceledEmail,
} from "./email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables.");
      return new Response(JSON.stringify({ error: "Configuration missing" }), { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    const { type, record, old_record } = payload;

    // We only care about sessions table, inserts and updates
    if (type !== 'INSERT' && type !== 'UPDATE') {
      return new Response(JSON.stringify({ message: "Ignored, not INSERT/UPDATE" }), { status: 200, headers: corsHeaders });
    }

    const sessionId = record.id;
    const studentId = record.student_id;
    const tutorId = record.tutor_id;
    const subject = record.subject;
    const sessionDate = record.session_date;
    const startTime = record.start_time;
    const newStatus = record.status;
    const oldStatus = old_record?.status;

    // Determine what event this is
    let emailType = null;
    if (type === 'INSERT') {
      emailType = 'CREATED';
    } else if (type === 'UPDATE' && oldStatus !== newStatus) {
      if (newStatus === 'confirmed') {
        emailType = 'CONFIRMED';
      } else if (newStatus === 'canceled' || newStatus === 'cancelled') {
        emailType = 'CANCELED';
      }
    }

    if (!emailType) {
      console.log("No email required for this event (status hasn't changed to a target state).");
      return new Response(JSON.stringify({ message: "No email needed" }), { status: 200, headers: corsHeaders });
    }

    // Fetch student and tutor profiles to get names and emails
    const [{ data: studentProfile }, { data: tutorProfile }, { data: studentAuth }, { data: tutorAuth }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name").eq("user_id", studentId).single(),
      supabaseAdmin.from("profiles").select("full_name").eq("user_id", tutorId).single(),
      supabaseAdmin.auth.admin.getUserById(studentId),
      supabaseAdmin.auth.admin.getUserById(tutorId),
    ]);

    const studentName = studentProfile?.full_name || "Student";
    const tutorName = tutorProfile?.full_name || "Tutor";
    const studentEmail = studentAuth?.user?.email;
    const tutorEmail = tutorAuth?.user?.email;

    if (!studentEmail && !tutorEmail) {
      throw new Error("Could not find emails for student or tutor");
    }

    let to = "";
    let subjectLine = "";
    let htmlContent = "";

    if (emailType === 'CREATED') {
      to = tutorEmail || "";
      subjectLine = `New Session Request: ${subject}`;
      htmlContent = getSessionCreatedEmail(studentName, tutorName, subject, sessionDate, startTime);
    } else if (emailType === 'CONFIRMED') {
      to = studentEmail || "";
      subjectLine = `Session Confirmed: ${subject}`;
      htmlContent = getSessionConfirmedEmail(studentName, tutorName, subject, sessionDate, startTime);
    } else if (emailType === 'CANCELED') {
      // For simplicity, let's notify the student
      to = studentEmail || "";
      subjectLine = `Session Canceled: ${subject}`;
      htmlContent = getSessionCanceledEmail(studentName, tutorName, subject, sessionDate, startTime, false);
    }

    if (!to) {
      console.log("Recipient email is missing.");
      return new Response(JSON.stringify({ message: "Recipient email is missing" }), { status: 200, headers: corsHeaders });
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tutor Quest Notifications <onboarding@resend.dev>",
        to: [to],
        subject: subjectLine,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API Error:", errorText);
      throw new Error(`Resend API failed: ${errorText}`);
    }

    const resendData = await res.json();
    console.log("Email sent successfully:", resendData);

    return new Response(JSON.stringify({ success: true, message: "Email sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
