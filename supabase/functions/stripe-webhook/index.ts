import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing signature or webhook secret" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await supabaseAdmin
          .from("payments")
          .update({ payment_status: "completed", captured_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await supabaseAdmin
          .from("payments")
          .update({ payment_status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await supabaseAdmin
            .from("payments")
            .update({ payment_status: "refunded", refunded_at: new Date().toISOString() })
            .eq("stripe_payment_intent_id", charge.payment_intent as string);
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = await stripe.charges.retrieve(dispute.charge as string);
        if (charge.payment_intent) {
          // Mark payment as disputed
          const { data: payment } = await supabaseAdmin
            .from("payments")
            .select("id, student_id, session_id")
            .eq("stripe_payment_intent_id", charge.payment_intent as string)
            .single();

          if (payment) {
            // Create a dispute record
            await supabaseAdmin.from("disputes").insert({
              payment_id: payment.id,
              session_id: payment.session_id,
              raised_by: payment.student_id,
              reason: "Stripe dispute",
              description: `Stripe dispute created: ${dispute.reason}`,
              status: "open",
            });

            await supabaseAdmin
              .from("payments")
              .update({ payment_status: "disputed" })
              .eq("id", payment.id);
          }
        }
        break;
      }

      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = await stripe.charges.retrieve(dispute.charge as string);
        if (charge.payment_intent) {
          const newStatus = dispute.status === "won" ? "completed" : "refunded";
          await supabaseAdmin
            .from("payments")
            .update({ 
              payment_status: newStatus,
              ...(newStatus === "refunded" ? { refunded_at: new Date().toISOString() } : {})
            })
            .eq("stripe_payment_intent_id", charge.payment_intent as string);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
