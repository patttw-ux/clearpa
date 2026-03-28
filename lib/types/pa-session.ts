import type { PaAnswer } from "@/lib/types/analysis";

export type SessionStatus = "complete" | "submitted" | "approved" | "denied";

/** Built in ResultsPanel when saving to history */
export type SessionSavePayload = {
  questions: string[];
  answers: PaAnswer[];
  /** Final body text per question index (includes coordinator overrides) */
  bodyByIndex: Record<number, string>;
};

/** Stored in `pa_sessions.session_data` */
export type PaSessionData = {
  questions: string[];
  answers: PaAnswer[];
  /** Final body text per question index (includes coordinator edits from UI) */
  bodyByIndex: Record<string, string>;
};

export type PaSessionRow = {
  id: string;
  created_at: string;
  patient_initials: string | null;
  payer_name: string | null;
  drug_name: string | null;
  questions_count: number | null;
  answered_count: number | null;
  flagged_count: number | null;
  warning_count: number | null;
  status: SessionStatus | null;
  session_data: PaSessionData | null;
};

export type SaveSessionInput = {
  patientInitials: string;
  payerName: string;
  drugName: string;
  questionsCount: number;
  answeredCount: number;
  flaggedCount: number;
  warningCount: number;
  status?: SessionStatus;
  sessionData: PaSessionData;
};
