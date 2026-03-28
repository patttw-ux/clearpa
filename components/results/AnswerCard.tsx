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
  /** Stagger entrance (results list) */
  cardIndex?: number;
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
  cardIndex = 0,
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
      <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 font-display text-xs font-medium text-[#166534] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-150 ease-out">
        Answered
      </span>
    ) : status === "flagged" ? (
      <span className="rounded-full bg-[#fef9c3] px-2.5 py-0.5 font-display text-xs font-medium text-[#854d0e] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 ease-out">
        Review needed
      </span>
    ) : (
      <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 font-display text-xs font-medium text-[#991b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 ease-out">
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
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: cardIndex * 0.1,
        }}
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
                <p className="answer-mono whitespace-pre-wrap text-foreground">
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
              <p className="answer-mono whitespace-pre-wrap text-foreground">
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
                <p className="answer-mono whitespace-pre-wrap text-foreground">
                  {bodyText || "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: cardIndex * 0.1,
      }}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white transition-[border-color,box-shadow] duration-300 ease-out",
        "border-l-[3px]",
        borderAccent,
        (editingAnswered || editingWarningNotes) &&
          "border-primary ring-1 ring-primary/25",
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
              <p className="answer-mono whitespace-pre-wrap text-foreground">
                {bodyText}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <ConfidenceRow confidence={data.confidence} />
              <button
                type="button"
                onClick={() => setEditingAnswered(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-display text-xs font-medium text-foreground transition-all duration-150 ease-out hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </button>
            </div>
          </>
        )}

        {status === "answered" && data && editingAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-3"
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={cn(
                "answer-mono min-h-[120px] w-full resize-y rounded-lg border border-primary/50 bg-secondary px-3 py-3 text-foreground",
                "outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-primary focus:ring-2 focus:ring-primary/25",
              )}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveAnsweredEdit}
                className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground transition-all duration-150 ease-out hover:bg-primary/90"
              >
                Save
              </button>
              <button
                type="button"
                onClick={discardAnsweredEdit}
                className="rounded-lg border border-border bg-transparent px-4 py-2 font-display text-sm font-medium text-foreground transition-all duration-150 ease-out hover:bg-muted"
              >
                Discard
              </button>
            </div>
          </motion.div>
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
                  "answer-mono min-h-[100px] w-full resize-y bg-transparent italic text-foreground placeholder:text-muted-foreground",
                  "outline-none transition-[box-shadow,border-color] duration-200 ease-out focus:ring-2 focus:ring-primary/25",
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
              <p className="answer-mono whitespace-pre-wrap text-foreground">
                {bodyText || "—"}
              </p>
              <button
                type="button"
                onClick={() => setEditingWarningNotes(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-display text-xs font-medium transition-all duration-150 ease-out hover:bg-muted"
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
                  "answer-mono min-h-[88px] w-full resize-y rounded-md border border-primary/30 bg-white/80 px-3 py-2 text-foreground",
                  "outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-primary focus:ring-2 focus:ring-primary/25",
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
