"use client";

import { useCallback, useEffect, useState } from "react";

export type WorkflowState =
  | "idle" // Upload screen
  | "analyzing" // ThinkingPanel active, uploads locked
  | "complete" // ResultsPanel showing, ThinkingPanel collapsed
  | "error"; // Error state with retry option

type UseWorkflowOptions = {
  /** True while PDFs are being read before streaming starts */
  extractBusy: boolean;
  /** True while the analyze API stream is active */
  isAnalyzing: boolean;
  /** True when the analysis stream finished successfully */
  isComplete: boolean;
  /** Error message from useAnalysis (Claude / network) */
  analysisError: string | null;
};

/**
 * Orchestrates New PA page phases. Syncs analyzing → complete | error from useAnalysis.
 *
 * Transitions:
 * - idle → analyzing: call `beginAnalysis()` (e.g. on "Analyze PA" when inputs are valid)
 * - analyzing → complete: when `isComplete && !isAnalyzing` and not blocked by extract
 * - analyzing → error: when `analysisError` is set, or call `fail()` from the page (e.g. PDF extract)
 * - complete → idle: `resetToIdle()` (e.g. "Start Over")
 * - error → idle: `resetToIdle()` (e.g. "Try Again")
 */
export function useWorkflow({
  extractBusy,
  isAnalyzing,
  isComplete,
  analysisError,
}: UseWorkflowOptions) {
  const [state, setState] = useState<WorkflowState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const beginAnalysis = useCallback(() => {
    setErrorMessage(null);
    setState("analyzing");
  }, []);

  const resetToIdle = useCallback(() => {
    setErrorMessage(null);
    setState("idle");
  }, []);

  const fail = useCallback((message: string) => {
    setErrorMessage(message);
    setState("error");
  }, []);

  useEffect(() => {
    if (state !== "analyzing") return;
    if (extractBusy) return;
    if (analysisError) {
      setErrorMessage(analysisError);
      setState("error");
      return;
    }
    if (isComplete && !isAnalyzing) {
      setState("complete");
    }
  }, [
    state,
    extractBusy,
    isAnalyzing,
    isComplete,
    analysisError,
  ]);

  return {
    state,
    errorMessage,
    beginAnalysis,
    resetToIdle,
    fail,
  };
}
