-- Sessions table
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  subject text NOT NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Both student and tutor can view their sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Students can create sessions (book)
CREATE POLICY "Students can book sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Both can update (tutor accepts/declines, student cancels)
CREATE POLICY "Participants can update sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Indexes
CREATE INDEX idx_sessions_student ON public.sessions(student_id);
CREATE INDEX idx_sessions_tutor ON public.sessions(tutor_id);
CREATE INDEX idx_sessions_date ON public.sessions(session_date);
CREATE INDEX idx_sessions_status ON public.sessions(status);

-- Trigger for updated_at
CREATE TRIGGER update_sessions_timestamp
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;