import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_COMMISSION_RATE = 0.10; // 10%

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
    if (!user?.email) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    // Fetch session details
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) throw new Error("Session not found");
    if (session.student_id !== user.id) throw new Error("Only the student can pay for this session");
    if (session.status !== "confirmed") throw new Error("Session must be confirmed before payment");

    // Get tutor's hourly rate
    const { data: tutorProfile } = await supabaseAdmin
      .from("tutor_profiles")
      .select("hourly_rate")
      .eq("user_id", session.tutor_id)
      .single();

    if (!tutorProfile?.hourly_rate) throw new Error("Tutor has no hourly rate set");

    // Calculate amount based on session duration
    const startParts = session.start_time.split(":");
    const endParts = session.end_time.split(":");
    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    const durationHours = Math.max((endMinutes - startMinutes) / 60, 0.5);

    const totalAmount = Math.round(tutorProfile.hourly_rate * durationHours * 100); // in paise/cents
    const commission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
    const tutorEarnings = totalAmount - commission;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session with manual capture (escrow)
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Tutoring Session - ${session.subject}`,
              description: `${session.session_date} | ${session.start_time} - ${session.end_time}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual", // Escrow: authorize but don't capture yet
        metadata: {
          session_id,
          student_id: session.student_id,
          tutor_id: session.tutor_id,
          commission: commission.toString(),
          tutor_earnings: tutorEarnings.toString(),
        },
      },
      success_url: `${req.headers.get("origin")}/sessions?payment=success&session_id=${session_id}`,
      cancel_url: `${req.headers.get("origin")}/sessions?payment=cancelled`,
    });

    // Create payment record
    await supabaseAdmin.from("payments").insert({
      student_id: session.student_id,
      tutor_id: session.tutor_id,
      session_id,
      amount: totalAmount / 100,
      platform_commission: commission / 100,
      tutor_earnings: tutorEarnings / 100,
      stripe_checkout_session_id: checkoutSession.id,
      stripe_payment_intent_id: checkoutSession.payment_intent as string,
      payment_status: "pending",
    });

    return new Response(JSON.stringify({ url: checkoutSession.url }), {
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
