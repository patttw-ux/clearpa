"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveSession } from "@/lib/pa-sessions";
import type { SessionSavePayload } from "@/lib/types/pa-session";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const PAYERS = ["UHC", "Cigna", "BCBS", "Aetna", "Humana", "Other"] as const;
const DRUGS = ["Xiidra", "Cequa", "Other"] as const;

/** Lowercase names avoid TSX parsing `useState<...>` as JSX. */
type payerChoice = (typeof PAYERS)[number];
type drugChoice = (typeof DRUGS)[number];

type SaveSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SessionSavePayload | null;
  summary: {
    answered: number;
    flagged: number;
    warning: number;
  };
};

export function SaveSessionDialog({
  open,
  onOpenChange,
  payload,
  summary,
}: SaveSessionDialogProps) {
  const [initials, setInitials] = useState("");
  const [payer, setPayer] = useState<payerChoice>("UHC");
  const [payerOther, setPayerOther] = useState("");
  const [drug, setDrug] = useState<drugChoice>("Cequa");
  const [drugOther, setDrugOther] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInitials("");
    setPayer("UHC");
    setPayerOther("");
    setDrug("Cequa");
    setDrugOther("");
  }, [open, payload]);

  const payerResolved = payer === "Other" ? payerOther.trim() : payer;
  const drugResolved = drug === "Other" ? drugOther.trim() : drug;

  const handleSubmit = useCallback(async () => {
    if (!payload) {
      toast.error("Nothing to save.");
      return;
    }
    const raw = initials.trim().toUpperCase();
    if (raw.length < 2 || raw.length > 3) {
      toast.error("Enter 2–3 patient initials only (no full names).");
      return;
    }
    if (!/^[A-Z]{2,3}$/.test(raw)) {
      toast.error("Initials must be letters only (2–3 characters).");
      return;
    }
    if (payer === "Other" && !payerOther.trim()) {
      toast.error("Enter payer name.");
      return;
    }
    if (drug === "Other" && !drugOther.trim()) {
      toast.error("Enter drug name.");
      return;
    }
    if (!isSupabaseConfigured()) {
      toast.error(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const bodyByIndex: Record<string, string> = {};
      for (const [k, v] of Object.entries(payload.bodyByIndex)) {
        bodyByIndex[k] = v;
      }

      await saveSession({
        patientInitials: raw,
        payerName: payerResolved,
        drugName: drugResolved,
        questionsCount: payload.questions.length,
        answeredCount: summary.answered,
        flaggedCount: summary.flagged,
        warningCount: summary.warning,
        status: "complete",
        sessionData: {
          questions: payload.questions,
          answers: payload.answers,
          bodyByIndex,
        },
      });
      toast.success("Session saved to history.");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not save session.");
    } finally {
      setSubmitting(false);
    }
  }, [
    drug,
    drugOther,
    drugResolved,
    initials,
    onOpenChange,
    payload,
    payer,
    payerOther,
    payerResolved,
    summary.answered,
    summary.flagged,
    summary.warning,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save session</DialogTitle>
          <DialogDescription>
            Store this PA in history for your team. Nothing is saved until you
            submit — HIPAA: use initials only, never full patient names.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label
              htmlFor="save-initials"
              className="font-display text-sm font-medium text-foreground"
            >
              Patient initials
            </label>
            <input
              id="save-initials"
              value={initials}
              onChange={(e) =>
                setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
              }
              maxLength={3}
              placeholder="e.g. JM"
              autoComplete="off"
              className={cn(
                "h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm uppercase tracking-widest",
                "outline-none focus:border-primary focus:ring-2 focus:ring-ring/30",
              )}
            />
            <p className="text-xs text-muted-foreground">
              2–3 letters. Do not enter full names.
            </p>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="save-payer"
              className="font-display text-sm font-medium text-foreground"
            >
              Payer
            </label>
            <select
              id="save-payer"
              value={payer}
              onChange={(e) =>
                setPayer(e.target.value as payerChoice)
              }
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {PAYERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {payer === "Other" && (
              <input
                value={payerOther}
                onChange={(e) => setPayerOther(e.target.value)}
                placeholder="Payer name"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              />
            )}
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="save-drug"
              className="font-display text-sm font-medium text-foreground"
            >
              Drug
            </label>
            <select
              id="save-drug"
              value={drug}
              onChange={(e) =>
                setDrug(e.target.value as drugChoice)
              }
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {DRUGS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {drug === "Other" && (
              <input
                value={drugOther}
                onChange={(e) => setDrugOther(e.target.value)}
                placeholder="Drug name"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-transparent px-4 font-display text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !payload}
            onClick={() => void handleSubmit()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save to history"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
