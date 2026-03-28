"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { ThinkingStep } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

import { ThinkingEntry } from "./ThinkingEntry";

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type ThinkingPanelProps = {
  steps: ThinkingStep[];
  isAnalyzing: boolean;
  isComplete: boolean;
  elapsedSeconds: number;
  /** True while PDFs are being extracted before the stream (keep panel visible) */
  isPending?: boolean;
  /** Increment when a new analysis run starts to reset collapse behavior */
  runKey?: number;
  className?: string;
};

export function ThinkingPanel({
  steps,
  isAnalyzing,
  isComplete,
  elapsedSeconds,
  isPending = false,
  runKey = 0,
  className,
}: ThinkingPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const analysisFinished = useMemo(
    () =>
      isComplete ||
      (!isAnalyzing && steps.some((s) => s.type === "complete")),
    [isComplete, isAnalyzing, steps],
  );

  const headerTitle = analysisFinished
    ? "Analysis complete"
    : "Claude is analyzing your chart";

  useEffect(() => {
    setCollapsed(false);
  }, [runKey]);

  useEffect(() => {
    if (isComplete) {
      setCollapsed(true);
    }
  }, [isComplete]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [steps]);

  const showPanel = steps.length > 0 || isAnalyzing || isPending;
  if (!showPanel) return null;

  return (
    <section
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border border-l-[3px] border-l-primary bg-card shadow-none",
        className,
      )}
    >
      <div className="bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {analysisFinished ? (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
            ) : (
              <span
                className="thinking-dot h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
            )}
            <p className="truncate font-display text-sm font-medium text-foreground">
              {headerTitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {formatElapsed(elapsedSeconds)}
            </span>
            {(isComplete || steps.length > 0) && (
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="font-display text-xs font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                {collapsed ? "Show reasoning" : "Hide reasoning"}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="log"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-t border-border/70"
            >
              <div
                ref={logRef}
                className="max-h-[280px] overflow-y-auto px-2"
              >
                <div className="px-2 pb-2 pt-1">
                  {steps.map((step) => (
                    <ThinkingEntry key={step.id} step={step} />
                  ))}
                  {(isAnalyzing || isPending) && steps.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {isPending && !isAnalyzing
                        ? "Reading PDFs…"
                        : "Waiting for stream…"}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
