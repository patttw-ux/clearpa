"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  PenLine,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import type { ThinkingStep, ThinkingStepType } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

function iconFor(type: ThinkingStepType, stepId: string) {
  const common = "h-4 w-4 shrink-0";
  switch (type) {
    case "reading":
      return <Search className={cn(common, "text-primary")} strokeWidth={2} />;
    case "question":
      return (
        <MessageSquare
          className={cn(common, "text-muted-foreground")}
          strokeWidth={2}
        />
      );
    case "found":
      return (
        <motion.span
          key={`found-${stepId}`}
          className="inline-flex text-accent"
          initial={{ scale: 0.5 }}
          animate={{ scale: [0.5, 1.2, 1] }}
          transition={{ duration: 0.3, ease: "easeOut", times: [0, 0.45, 1] }}
        >
          <CheckCircle2 className={common} strokeWidth={2} />
        </motion.span>
      );
    case "flagged":
      return (
        <AlertTriangle
          className={cn(common, "text-warning")}
          strokeWidth={2}
        />
      );
    case "warning":
      return (
        <ShieldAlert
          className={cn(common, "text-destructive")}
          strokeWidth={2}
        />
      );
    case "drafting":
      return <PenLine className={cn(common, "text-primary")} strokeWidth={2} />;
    case "complete":
      return (
        <Sparkles className={cn(common, "text-primary")} strokeWidth={2} />
      );
    default:
      return null;
  }
}

function formatStamp(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ThinkingEntry({
  step,
  index,
}: {
  step: ThinkingStep;
  index: number;
}) {
  const warningFlash = step.type === "warning";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.045,
      }}
      className={cn(
        "flex gap-3 border-b border-border/60 py-3 last:border-b-0",
        warningFlash && "thinking-warning-flash rounded-md px-1 -mx-1",
      )}
    >
      <div className="mt-0.5 flex w-4 justify-center">
        {iconFor(step.type, step.id)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-foreground">{step.text}</p>
      </div>
      <time
        className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
        dateTime={`PT${step.atSeconds}S`}
      >
        {formatStamp(step.atSeconds)}
      </time>
    </motion.div>
  );
}
