CREATE TABLE pa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  patient_initials TEXT, -- coordinator-entered, never full name
  payer_name TEXT,
  drug_name TEXT,
  questions_count INTEGER,
  answered_count INTEGER,
  flagged_count INTEGER,
  warning_count INTEGER,
  status TEXT CHECK (status IN ('complete', 'submitted', 'approved', 'denied')),
  session_data JSONB -- stores questions and answers for review
);

-- Row-level security: for now, no auth (hackathon), all rows visible
ALTER TABLE pa_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for hackathon" ON pa_sessions FOR ALL USING (true);
