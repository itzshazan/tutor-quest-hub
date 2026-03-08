-- Create withdrawal_requests table for tutor earnings withdrawal
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  payout_method TEXT DEFAULT 'bank_transfer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disputes table for session disputes
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id),
  payment_id UUID REFERENCES public.payments(id),
  raised_by UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  resolution TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Withdrawal requests policies
CREATE POLICY "Tutors can view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Disputes policies
CREATE POLICY "Users can view own disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = raised_by);

CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = raised_by);

CREATE POLICY "Users can update own open disputes" ON public.disputes
  FOR UPDATE USING (auth.uid() = raised_by AND status = 'open');

CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all disputes" ON public.disputes
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));