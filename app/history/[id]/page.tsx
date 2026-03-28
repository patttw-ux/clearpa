"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AnswerCard } from "@/components/results/AnswerCard";
import { getSession, updateSessionStatus } from "@/lib/pa-sessions";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PaAnswer } from "@/lib/types/analysis";
import type {
  PaSessionData,
  PaSessionRow,
  SessionStatus,
} from "@/lib/types/pa-session";
import { cn } from "@/lib/utils";

const STATUSES: SessionStatus[] = [
  "complete",
  "submitted",
  "approved",
  "denied",
];

function statusLabel(s: SessionStatus): string {
  switch (s) {
    case "complete":
      return "Complete";
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    default:
      return s;
  }
}

function parseData(raw: unknown): PaSessionData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.questions) || !Array.isArray(o.answers)) return null;
  const bodyRaw = o.bodyByIndex;
  const bodyByIndex: Record<string, string> = {};
  if (bodyRaw && typeof bodyRaw === "object") {
    for (const [k, v] of Object.entries(bodyRaw as Record<string, unknown>)) {
      if (typeof v === "string") bodyByIndex[k] = v;
    }
  }
  return {
    questions: o.questions as string[],
    answers: o.answers as PaAnswer[],
    bodyByIndex,
  };
}

function bodyForIndex(data: PaSessionData | null, i: number): string {
  if (!data) return "";
  const v = data.bodyByIndex[String(i)];
  return typeof v === "string" ? v : "";
}

export default function HistoryDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [row, setRow] = useState<PaSessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    if (!id || !isSupabaseConfigured()) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    getSession(id)
      .then((r) => {
        if (!r) setNotFound(true);
        else setRow(r as PaSessionRow);
      })
      .catch((e: Error) => {
        toast.error(e.message);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const sessionData = useMemo(
    () => parseData(row?.session_data as unknown),
    [row?.session_data],
  );

  const status = (row?.status as SessionStatus | null) ?? "complete";

  const handleStatusChange = useCallback(
    async (next: SessionStatus) => {
      if (!row || next === status) return;
      try {
        await updateSessionStatus(row.id, next);
        setRow((prev) => (prev ? { ...prev, status: next } : prev));
        toast.success(`Status updated to ${statusLabel(next)}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    },
    [row, status],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !row || !sessionData) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10">
        <p className="text-muted-foreground">Session not found.</p>
        <Link
          href="/history"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
      </div>
    );
  }

  const questions = sessionData.questions;
  const answers = sessionData.answers;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 md:py-10">
      <Link
        href="/history"
        className="inline-flex items-center gap-2 font-display text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </Link>

      <div className="mt-6 flex flex-col gap-4 border-b border-border/80 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            PA session
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {row.patient_initials} · {row.payer_name} · {row.drug_name}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="session-status"
            className="font-display text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Workflow status
          </label>
          <select
            id="session-status"
            value={status}
            onChange={(e) =>
              void handleStatusChange(e.target.value as SessionStatus)
            }
            className={cn(
              "h-10 min-w-[12rem] rounded-lg border border-border bg-card px-3 font-display text-sm font-medium",
            )}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Questions &amp; answers
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only snapshot from when the session was saved.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {questions.map((q, i) => {
            const data =
              answers.find((a) => a.questionIndex === i) ?? null;
            return (
              <AnswerCard
                key={`${i}-${q.slice(0, 24)}`}
                questionNumber={i + 1}
                questionText={q}
                data={data}
                bodyText={bodyForIndex(sessionData, i)}
                readOnly
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
