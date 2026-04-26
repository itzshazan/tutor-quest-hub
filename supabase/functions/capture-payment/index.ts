import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    // Rate limit: 10 capture attempts per minute per user
    const rateCheck = checkRateLimit(`capture:${user.id}`, { limit: 10, windowMs: 60000 });
    if (rateCheck.limited) {
      return rateLimitResponse(rateCheck.retryAfter!, corsHeaders);
    }

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch session - only tutor can mark as completed
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session) throw new Error("Session not found");
    if (session.tutor_id !== user.id && session.student_id !== user.id) {
      throw new Error("Only session participants can capture payment");
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("session_id", session_id)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError) throw new Error(`DB Error: ${paymentError.message}`);
    if (!payment) throw new Error("No pending payment found for this session");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_CUSTOM") || Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let paymentIntentId = payment.stripe_payment_intent_id as string | null;

    // Fallback: if webhook has not synced payment_intent yet, retrieve it from Checkout Session.
    if (!paymentIntentId && payment.stripe_checkout_session_id) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id);
      if (typeof checkoutSession.payment_intent === "string") {
        paymentIntentId = checkoutSession.payment_intent;

        await supabaseAdmin
          .from("payments")
          .update({ stripe_payment_intent_id: paymentIntentId })
          .eq("id", payment.id);
      }
    }

    if (!paymentIntentId) {
      throw new Error("Payment authorization not ready yet. Complete checkout first.");
    }

    // Capture the payment (release from escrow)
    await stripe.paymentIntents.capture(paymentIntentId);

    // Update payment status
    await supabaseAdmin
      .from("payments")
      .update({ payment_status: "completed", captured_at: new Date().toISOString() })
      .eq("id", payment.id);

    // Update session status to completed
    await supabaseAdmin
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", session_id);

    // Send notification
    try {
      const notifUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-session-notification`;
      await fetch(notifUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          ...Object.fromEntries(
            Object.entries(corsHeaders).filter(([k]) => !k.startsWith("Access"))
          ),
        },
        body: JSON.stringify({ session_id, event_type: "completed" }),
      });
    } catch (e) { console.error("Notification failed:", e); }

    return new Response(JSON.stringify({ success: true, message: "Payment captured and session completed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
