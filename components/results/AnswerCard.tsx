"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

import type { PaAnswer } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

type AnswerCardProps = {
  questionNumber: number;
  questionText: string;
  data: PaAnswer | null;
  bodyText: string;
  onBodyChange?: (value: string) => void;
  /** History detail view — no editing */
  readOnly?: boolean;
};

function ConfidenceRow({ confidence }: { confidence: PaAnswer["confidence"] }) {
  const label =
    confidence === "high"
      ? "High confidence"
      : confidence === "medium"
        ? "Medium confidence"
        : "Low confidence";
  const dotClass =
    confidence === "high"
      ? "bg-accent"
      : confidence === "medium"
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
      <span>{label}</span>
    </div>
  );
}

export function AnswerCard({
  questionNumber,
  questionText,
  data,
  bodyText,
  onBodyChange,
  readOnly = false,
}: AnswerCardProps) {
  const status = data?.status ?? "flagged";
  const setBody = onBodyChange ?? (() => {});
  const [expanded, setExpanded] = useState(false);
  const [editingAnswered, setEditingAnswered] = useState(false);
  const [draft, setDraft] = useState(bodyText);
  const [editingWarningNotes, setEditingWarningNotes] = useState(false);
  const [warningDraft, setWarningDraft] = useState(bodyText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingAnswered) {
      setDraft(bodyText);
    }
  }, [editingAnswered, bodyText]);

  useEffect(() => {
    setWarningDraft(bodyText);
  }, [bodyText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
  }, [bodyText, draft, editingAnswered, status]);

  const borderAccent =
    status === "answered"
      ? "border-l-accent"
      : status === "flagged"
        ? "border-l-warning"
        : "border-l-destructive";

  const statusBadge =
    status === "answered" ? (
      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-display text-xs font-medium text-accent">
        Answered
      </span>
    ) : status === "flagged" ? (
      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 font-display text-xs font-medium text-warning">
        Review needed
      </span>
    ) : (
      <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 font-display text-xs font-medium text-destructive">
        Action required
      </span>
    );

  const longQuestion = questionText.length > 90;

  function saveAnsweredEdit() {
    setBody(draft);
    setEditingAnswered(false);
  }

  function discardAnsweredEdit() {
    setDraft(bodyText);
    setEditingAnswered(false);
  }

  if (readOnly) {
    return (
      <article
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card",
          "border-l-[3px]",
          borderAccent,
        )}
      >
        <div className="flex gap-3 border-b border-border/80 px-4 py-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            aria-hidden
          >
            {questionNumber}
          </div>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => longQuestion && setExpanded((e) => !e)}
              className={cn(
                "w-full text-left font-display text-sm font-medium leading-snug text-foreground",
                !expanded && longQuestion && "line-clamp-2",
              )}
            >
              {questionText}
            </button>
            {longQuestion && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="mt-0.5 font-display text-xs font-medium text-primary hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
          <div className="shrink-0 pt-0.5">{statusBadge}</div>
        </div>

        <div className="px-4 py-4">
          {status === "answered" && data && (
            <>
              <div className="rounded-lg bg-secondary px-3 py-3">
                <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
                  {bodyText}
                </p>
              </div>
              <div className="mt-3">
                <ConfidenceRow confidence={data.confidence} />
              </div>
            </>
          )}

          {status === "flagged" && (
            <div className="rounded-lg bg-warning/10 px-3 py-3">
              <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
                {bodyText.trim() || "—"}
              </p>
            </div>
          )}

          {status === "warning" && data && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-3">
                <p className="text-sm font-bold leading-relaxed text-destructive">
                  {data.answer}
                </p>
                {data.suggestedAction && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {data.suggestedAction}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-destructive/[0.06] px-3 py-3">
                <p className="mb-2 text-xs font-medium text-destructive">
                  Coordinator response / notes
                </p>
                <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
                  {bodyText || "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <motion.article
      layout
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white",
        "border-l-[3px]",
        borderAccent,
      )}
    >
      <div className="flex gap-3 border-b border-border/80 px-4 py-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
          aria-hidden
        >
          {questionNumber}
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => longQuestion && setExpanded((e) => !e)}
            className={cn(
              "w-full text-left font-display text-sm font-medium leading-snug text-foreground",
              !expanded && longQuestion && "line-clamp-2",
            )}
          >
            {questionText}
          </button>
          {longQuestion && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-0.5 font-display text-xs font-medium text-primary hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div className="shrink-0 pt-0.5">{statusBadge}</div>
      </div>

      <div className="px-4 py-4">
        {status === "answered" && data && !editingAnswered && (
          <>
            <div className="rounded-lg bg-secondary px-3 py-3">
              <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
                {bodyText}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <ConfidenceRow confidence={data.confidence} />
              <button
                type="button"
                onClick={() => setEditingAnswered(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-display text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </button>
            </div>
          </>
        )}

        {status === "answered" && data && editingAnswered && (
          <div className="flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={cn(
                "min-h-[120px] w-full resize-y rounded-lg border border-border bg-secondary px-3 py-3 font-mono text-[13px] leading-relaxed text-foreground",
                "outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring/30",
              )}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveAnsweredEdit}
                className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Save
              </button>
              <button
                type="button"
                onClick={discardAnsweredEdit}
                className="rounded-lg border border-border bg-transparent px-4 py-2 font-display text-sm font-medium text-foreground hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {status === "flagged" && (
          <div className="flex flex-col gap-2">
            <div className="rounded-lg bg-warning/10 px-3 py-3">
              <textarea
                ref={textareaRef}
                value={bodyText}
                onChange={(e) => setBody(e.target.value)}
                placeholder="— Not found in chart. Please complete manually. —"
                className={cn(
                  "min-h-[100px] w-full resize-y bg-transparent font-mono text-[13px] italic leading-relaxed text-foreground placeholder:text-muted-foreground",
                  "outline-none transition-shadow focus:ring-2 focus:ring-ring/30",
                )}
              />
            </div>
            <p className="text-xs text-warning">
              Claude could not locate this information. Add it from the chart.
            </p>
          </div>
        )}

        {status === "warning" && data && !editingWarningNotes && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-3">
              <p className="text-sm font-bold leading-relaxed text-destructive">
                {data.answer}
              </p>
              {data.suggestedAction && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {data.suggestedAction}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-destructive/[0.06] px-3 py-3">
              <p className="mb-2 text-xs font-medium text-destructive">
                Coordinator response / notes
              </p>
              <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
                {bodyText || "—"}
              </p>
              <button
                type="button"
                onClick={() => setEditingWarningNotes(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-display text-xs font-medium hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </button>
            </div>
          </div>
        )}

        {status === "warning" && data && editingWarningNotes && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-3">
              <p className="text-sm font-bold leading-relaxed text-destructive">
                {data.answer}
              </p>
              {data.suggestedAction && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {data.suggestedAction}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-destructive/[0.06] px-3 py-3">
              <p className="mb-2 text-xs font-medium text-destructive">
                Coordinator response / notes
              </p>
              <textarea
                ref={textareaRef}
                value={warningDraft}
                onChange={(e) => setWarningDraft(e.target.value)}
                className={cn(
                  "min-h-[88px] w-full resize-y rounded-md border border-transparent bg-white/80 px-3 py-2 font-mono text-[13px] leading-relaxed text-foreground",
                  "outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring/30",
                )}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBody(warningDraft);
                    setEditingWarningNotes(false);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWarningDraft(bodyText);
                    setEditingWarningNotes(false);
                  }}
                  className="rounded-lg border border-border px-4 py-2 font-display text-sm font-medium hover:bg-muted"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
