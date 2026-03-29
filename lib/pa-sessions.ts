import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  PaSessionData,
  PaSessionRow,
  SaveSessionInput,
  SessionStatus,
} from "@/lib/types/pa-session";

export async function saveSession(data: SaveSessionInput): Promise<{ id: string }> {
  const supabase = getSupabaseBrowserClient();
  const status: SessionStatus = data.status ?? "complete";

  const { data: row, error } = await supabase
    .from("pa_sessions")
    .insert({
      patient_initials: data.patientInitials.trim().toUpperCase(),
      payer_name: data.payerName,
      drug_name: data.drugName,
      questions_count: data.questionsCount,
      answered_count: data.answeredCount,
      flagged_count: data.flaggedCount,
      warning_count: data.warningCount,
      status,
      session_data: data.sessionData,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!row?.id) throw new Error("No session id returned.");
  return { id: row.id as string };
}

/** Row for analytics aggregations (no limit). */
export type AnalyticsSessionRow = {
  id: string;
  patient_initials: string | null;
  status: SessionStatus | null;
  answered_count: number | null;
  flagged_count: number | null;
  questions_count: number | null;
  payer_name: string | null;
  drug_name: string | null;
  created_at: string;
};

export async function fetchAnalyticsSessions(): Promise<AnalyticsSessionRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pa_sessions")
    .select(
      "id, patient_initials, status, answered_count, flagged_count, questions_count, payer_name, drug_name, created_at",
    );

  if (error) throw new Error(error.message);
  return (data ?? []) as AnalyticsSessionRow[];
}

export async function getSessions(): Promise<PaSessionRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pa_sessions")
    .select(
      "id, created_at, patient_initials, payer_name, drug_name, questions_count, answered_count, flagged_count, warning_count, status, session_data",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as PaSessionRow[];
}

export async function getSession(id: string): Promise<PaSessionRow | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pa_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PaSessionRow | null;
}

export async function updateSessionStatus(
  id: string,
  status: SessionStatus,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("pa_sessions")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteSessions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("pa_sessions").delete().in("id", ids);

  if (error) throw new Error(error.message);
}

/** Normalize JSONB session_data from DB */
export function parseSessionData(raw: unknown): PaSessionData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const questions = o.questions;
  const answers = o.answers;
  const bodyByIndex = o.bodyByIndex;
  if (!Array.isArray(questions) || !Array.isArray(answers)) return null;
  if (bodyByIndex !== undefined && typeof bodyByIndex !== "object")
    return null;
  return {
    questions: questions as string[],
    answers: answers as PaSessionData["answers"],
    bodyByIndex:
      bodyByIndex && typeof bodyByIndex === "object"
        ? (bodyByIndex as Record<string, string>)
        : {},
  };
}
