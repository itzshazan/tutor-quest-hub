
-- Create payments table for tracking all transactions
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  session_id uuid REFERENCES public.sessions(id),
  amount numeric NOT NULL,
  platform_commission numeric NOT NULL DEFAULT 0,
  tutor_earnings numeric NOT NULL DEFAULT 0,
  payment_method text,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  captured_at timestamp with time zone,
  refunded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Students can view their own payments
CREATE POLICY "Students can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Tutors can view payments where they are the tutor
CREATE POLICY "Tutors can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only edge functions (service role) insert/update payments, but allow authenticated insert for the checkout flow
CREATE POLICY "Authenticated users can create payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Allow updates by participants (for status changes via edge functions)
CREATE POLICY "Participants can update payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
