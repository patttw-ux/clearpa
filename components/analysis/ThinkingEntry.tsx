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

function iconFor(type: ThinkingStepType) {
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
        <CheckCircle2
          className={cn(common, "text-accent")}
          strokeWidth={2}
        />
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

export function ThinkingEntry({ step }: { step: ThinkingStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex gap-3 border-b border-border/60 py-3 last:border-b-0"
    >
      <div className="mt-0.5 flex w-4 justify-center">{iconFor(step.type)}</div>
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
