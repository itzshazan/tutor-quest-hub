import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Rate limit: 3 refund attempts per minute per user
    const rateCheck = checkRateLimit(`refund:${user.id}`, { limit: 3, windowMs: 60000 });
    if (rateCheck.limited) {
      return rateLimitResponse(rateCheck.retryAfter!, corsHeaders);
    }

    const { payment_id, reason } = await req.json();
    if (!payment_id) throw new Error("payment_id is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (!payment) throw new Error("Payment not found");
    if (payment.student_id !== user.id) throw new Error("Only the student can request a refund");
    if (payment.payment_status === "refunded") throw new Error("Payment already refunded");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    if (payment.payment_status === "pending" && payment.stripe_payment_intent_id) {
      // Cancel the uncaptured payment intent
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
    } else if (payment.payment_status === "completed" && payment.stripe_payment_intent_id) {
      // Refund the captured payment
      await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id });
    }

    await supabaseAdmin
      .from("payments")
      .update({ payment_status: "refunded", refunded_at: new Date().toISOString() })
      .eq("id", payment_id);

    // Update session status
    if (payment.session_id) {
      await supabaseAdmin
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", payment.session_id);
    }

    return new Response(JSON.stringify({ success: true, message: "Refund processed successfully" }), {
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
