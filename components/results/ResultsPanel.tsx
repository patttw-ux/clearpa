"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import type { PaAnswer } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

import { AnswerCard } from "./AnswerCard";

type ResultsPanelProps = {
  isComplete: boolean;
  questions: string[];
  answers: PaAnswer[];
  onStartOver: () => void;
  className?: string;
};

export function ResultsPanel({
  isComplete,
  questions,
  answers,
  onStartOver,
  className,
}: ResultsPanelProps) {
  const [overrides, setOverrides] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!isComplete) {
      setOverrides({});
    }
  }, [isComplete]);

  const summary = useMemo(() => {
    let answered = 0;
    let flagged = 0;
    let warning = 0;
    for (const a of answers) {
      if (a.status === "answered") answered += 1;
      else if (a.status === "flagged") flagged += 1;
      else if (a.status === "warning") warning += 1;
    }
    return { answered, flagged, warning };
  }, [answers]);

  const setBodyForIndex = useCallback((index: number, value: string) => {
    setOverrides((prev) => ({ ...prev, [index]: value }));
  }, []);

  const getBodyText = useCallback(
    (index: number, data: PaAnswer | null): string => {
      if (overrides[index] !== undefined) {
        return overrides[index]!;
      }
      if (!data) return "";
      if (data.status === "warning") return "";
      return data.answer;
    },
    [overrides],
  );

  const copyAll = useCallback(async () => {
    const lines: string[] = [];
    questions.forEach((q, i) => {
      const data = answers.find((a) => a.questionIndex === i) ?? null;
      const body = getBodyText(i, data);
      let aLine = body;
      if (!data || data.status === "flagged") {
        aLine =
          body.trim().length > 0
            ? body
            : "INCOMPLETE — coordinator to fill";
      } else if (data.status === "warning") {
        const notes = body.trim();
        const warn = data.answer;
        aLine =
          notes.length > 0
            ? `${warn}\n\nCoordinator notes: ${notes}`
            : warn;
      }
      lines.push(`Q${i + 1}: ${q}`);
      lines.push(`A: ${aLine}`);
      lines.push("");
    });

    const text = lines.join("\n").trim();
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${questions.length} answers copied to clipboard.`);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }, [questions, answers, getBodyText]);

  const exportPdf = useCallback(() => {
    console.log("Export as PDF");
  }, []);

  if (!isComplete || questions.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <div className="rounded-xl border border-border bg-card p-5 shadow-none md:p-6">
        <div className="flex flex-col gap-4 border-b border-border/80 pb-5 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Prior Authorization Answers
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/15 px-3 py-1 font-display text-xs font-medium text-accent">
              {summary.answered} Answered
            </span>
            <span className="rounded-full bg-warning/15 px-3 py-1 font-display text-xs font-medium text-warning">
              {summary.flagged} Flagged for review
            </span>
            {summary.warning > 0 && (
              <span className="rounded-full bg-destructive/15 px-3 py-1 font-display text-xs font-medium text-destructive">
                {summary.warning} Warnings
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {questions.map((q, i) => {
            const data = answers.find((a) => a.questionIndex === i) ?? null;
            return (
              <AnswerCard
                key={`${i}-${q.slice(0, 24)}`}
                questionNumber={i + 1}
                questionText={q}
                data={data}
                bodyText={getBodyText(i, data)}
                onBodyChange={(v) => setBodyForIndex(i, v)}
              />
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/80 pt-6 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void copyAll()}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            Copy All Answers
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card px-5 font-display text-sm font-medium text-foreground hover:bg-muted sm:w-auto"
          >
            Export as PDF
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-transparent px-5 font-display text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:w-auto"
          >
            Start Over
          </button>
        </div>
      </div>
    </motion.section>
  );
}
