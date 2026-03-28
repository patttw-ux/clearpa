"use client";

import type { PaAnswer } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

function statusStyles(status: PaAnswer["status"]) {
  switch (status) {
    case "answered":
      return "bg-primary/10 text-primary";
    case "flagged":
      return "bg-warning/15 text-warning";
    case "warning":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ResultsPanel({
  answers,
  className,
}: {
  answers: PaAnswer[];
  className?: string;
}) {
  if (answers.length === 0) return null;

  return (
    <section
      className={cn(
        "w-full rounded-xl border border-border bg-card p-5 shadow-none",
        className,
      )}
    >
      <h2 className="font-display text-base font-semibold text-foreground">
        Payer answers
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {answers.map((a) => (
          <li
            key={a.questionIndex}
            className="rounded-lg border border-border bg-background/80 p-4"
          >
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <span className="font-mono text-xs text-muted-foreground">
                Q{a.questionIndex + 1}
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-display text-xs font-medium",
                  statusStyles(a.status),
                )}
              >
                {a.status}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {a.confidence} confidence
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {a.answer}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
