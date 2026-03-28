"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  PaAnswer,
  ThinkingStep,
  ThinkingStepType,
} from "@/lib/types/analysis";

function nowSeconds(startMs: number): number {
  return Math.floor((Date.now() - startMs) / 1000);
}

function isThinkingType(t: string): t is ThinkingStepType {
  return (
    t === "reading" ||
    t === "question" ||
    t === "found" ||
    t === "flagged" ||
    t === "warning" ||
    t === "drafting" ||
    t === "complete"
  );
}

function pushThinkingFromPayload(
  payload: Record<string, unknown>,
  startMs: number,
): ThinkingStep | null {
  const typeRaw = payload.type;
  const text = typeof payload.text === "string" ? payload.text : "";
  if (typeof typeRaw !== "string" || !isThinkingType(typeRaw)) return null;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: typeRaw,
    text,
    atSeconds: nowSeconds(startMs),
  };
}

function answerFromPayload(payload: Record<string, unknown>): PaAnswer | null {
  const questionIndex = payload.questionIndex;
  const status = payload.status;
  const answer = payload.answer;
  const confidence = payload.confidence;
  if (typeof questionIndex !== "number") return null;
  if (status !== "answered" && status !== "flagged" && status !== "warning")
    return null;
  if (typeof answer !== "string") return null;
  if (confidence !== "high" && confidence !== "medium" && confidence !== "low")
    return null;
  const suggestedAction =
    typeof payload.suggestedAction === "string"
      ? payload.suggestedAction
      : undefined;
  return {
    questionIndex,
    status,
    answer,
    confidence,
    ...(suggestedAction !== undefined ? { suggestedAction } : {}),
  };
}

export function useAnalysis() {
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [answers, setAnswers] = useState<PaAnswer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startMsRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isAnalyzing) return;
    const id = window.setInterval(() => {
      setElapsedSeconds(nowSeconds(startMsRef.current));
    }, 250);
    return () => window.clearInterval(id);
  }, [isAnalyzing]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setThinkingSteps([]);
    setAnswers([]);
    setIsAnalyzing(false);
    setIsComplete(false);
    setError(null);
    setElapsedSeconds(0);
  }, []);

  const startAnalysis = useCallback(async (chartText: string, questions: string | string[]) => {
    abortRef.current?.abort();
    setAnswers([]);
    setError(null);
    setIsComplete(false);
    setIsAnalyzing(true);
    startMsRef.current = Date.now();
    setElapsedSeconds(0);

    const reading: ThinkingStep = {
      id: `reading-${startMsRef.current}`,
      type: "reading",
      text: "Reading patient chart...",
      atSeconds: 0,
    };
    setThinkingSteps([reading]);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const payload = {
        chartText: typeof chartText === "string" ? chartText : "",
        questions,
      };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = `Request failed (${res.status})`;
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const blocks = sseBuffer.split("\n\n");
        sseBuffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const trimmed = block.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(jsonStr) as Record<string, unknown>;
          } catch {
            continue;
          }

          const kind = data.kind as string | undefined;

          if (kind === "thinking") {
            const payload = data.payload as Record<string, unknown>;
            const step = pushThinkingFromPayload(payload, startMsRef.current);
            if (step) {
              setThinkingSteps((prev) => {
                if (step.type === "reading") {
                  return [...prev.filter((s) => s.type !== "reading"), step];
                }
                return [...prev, step];
              });
              if (step.type === "complete") {
                setIsComplete(true);
              }
            }
          } else if (kind === "answer") {
            const payload = data.payload as Record<string, unknown>;
            const ans = answerFromPayload(payload);
            if (ans) {
              setAnswers((prev) => {
                const next = [...prev];
                const idx = next.findIndex(
                  (a) => a.questionIndex === ans.questionIndex,
                );
                if (idx >= 0) next[idx] = ans;
                else next.push(ans);
                return next.sort((a, b) => a.questionIndex - b.questionIndex);
              });
            }
          } else if (kind === "done") {
            setIsComplete(true);
          } else if (kind === "error") {
            const message =
              typeof data.message === "string"
                ? data.message
                : "Unknown error";
            throw new Error(message);
          }
        }
      }

      setIsComplete(true);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
      abortRef.current = null;
    }
  }, []);

  return {
    thinkingSteps,
    answers,
    isAnalyzing,
    isComplete,
    error,
    elapsedSeconds,
    startAnalysis,
    reset,
  };
}
