"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Lock, Sparkles } from "lucide-react";

import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ThinkingPanel } from "@/components/analysis/ThinkingPanel";
import { DropZone } from "@/components/upload/DropZone";
import {
  QuestionnaireInput,
  type QuestionnaireTab,
} from "@/components/upload/QuestionnaireInput";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useWorkflow, type WorkflowState } from "@/hooks/useWorkflow";
import { extractPdfText } from "@/lib/pdf/extractText";
import { cn } from "@/lib/utils";

function AnalysisProgressBar({
  mode,
}: {
  mode: "hidden" | "indeterminate" | "success";
}) {
  if (mode === "hidden") return null;
  return (
    <div
      className="analysis-progress-track mb-6"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-busy={mode === "indeterminate"}
      aria-label={
        mode === "indeterminate" ? "Analysis in progress" : "Analysis complete"
      }
    >
      {mode === "indeterminate" && (
        <div className="analysis-progress-shimmer-bar" aria-hidden />
      )}
      {mode === "success" && (
        <div className="analysis-progress-success" aria-hidden />
      )}
    </div>
  );
}

export default function NewPAPage() {
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [questionnaireTab, setQuestionnaireTab] =
    useState<QuestionnaireTab>("upload");
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [extractBusy, setExtractBusy] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<string[]>([]);
  const [progressMode, setProgressMode] = useState<
    "hidden" | "indeterminate" | "success"
  >("hidden");

  const confettiRunRef = useRef<number | null>(null);

  const {
    thinkingSteps,
    answers,
    isAnalyzing,
    isComplete,
    error,
    elapsedSeconds,
    startAnalysis,
    reset,
  } = useAnalysis();

  const { state, errorMessage, beginAnalysis, resetToIdle, fail } =
    useWorkflow({
      extractBusy,
      isAnalyzing,
      isComplete,
      analysisError: error,
    });

  useEffect(() => {
    const titles: Record<WorkflowState, string> = {
      idle: "New PA — ClearPA",
      analyzing: "Analyzing... — ClearPA",
      complete: "Ready to submit — ClearPA",
      error: "New PA — ClearPA",
    };
    document.title = titles[state];
    return () => {
      document.title = "New PA — ClearPA";
    };
  }, [state]);

  useEffect(() => {
    if (state === "idle" || state === "error") {
      setProgressMode("hidden");
    } else if (state === "analyzing") {
      setProgressMode("indeterminate");
    } else if (state === "complete") {
      setProgressMode("success");
      const t = window.setTimeout(() => setProgressMode("hidden"), 800);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  useEffect(() => {
    if (state !== "complete") return;
    if (confettiRunRef.current === runKey) return;
    confettiRunRef.current = runKey;

    const duration = 1500;
    const end = Date.now() + duration;
    let rafId = 0;
    const tick = () => {
      if (Date.now() >= end) return;
      void confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.85 },
        colors: ["#22c55e", "#3b82f6", "#86efac"],
      });
      void confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.85 },
        colors: ["#22c55e", "#3b82f6", "#86efac"],
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [state, runKey]);

  const canAnalyze = useMemo(() => {
    const hasChart = Boolean(chartFile);
    const hasQuestionnaire =
      questionnaireTab === "upload"
        ? Boolean(questionnaireFile)
        : questionnaireText.trim().length > 0;
    return hasChart && hasQuestionnaire;
  }, [
    chartFile,
    questionnaireTab,
    questionnaireFile,
    questionnaireText,
  ]);

  const uploadsLocked = state === "analyzing";

  async function handleAnalyze() {
    if (state !== "idle" || !canAnalyze || extractBusy) return;
    if (!chartFile) return;

    reset();
    beginAnalysis();
    setRunKey((k) => k + 1);
    setExtractBusy(true);

    try {
      const chartText = await extractPdfText(chartFile);
      const chartPreview =
        chartText.length > 0 ? chartText.slice(0, 200) : "(empty)";
      console.log(
        "[ClearPA] Patient chart extract (first 200 chars):",
        chartPreview,
      );

      if (!chartText.trim()) {
        fail(
          "The patient chart PDF had no extractable text. It may be scanned images only—try a text-based PDF or OCR.",
        );
        return;
      }

      let questions: string | string[];
      if (questionnaireTab === "upload") {
        if (!questionnaireFile) return;
        const qText = await extractPdfText(questionnaireFile);
        console.log(
          "[ClearPA] Questionnaire extract (first 200 chars):",
          qText.length > 0 ? qText.slice(0, 200) : "(empty)",
        );
        if (!qText.trim()) {
          fail(
            "The payer questionnaire PDF had no extractable text. Try a text-based PDF or use Paste Questions.",
          );
          return;
        }
        const lines = qText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        questions = lines.length > 0 ? lines : [qText];
      } else {
        const raw = questionnaireText.trim();
        const lines = raw.split("\n").map((s) => s.trim()).filter(Boolean);
        questions = lines.length > 0 ? lines : [raw];
      }

      const qList = Array.isArray(questions) ? questions : [questions];
      setSessionQuestions(qList);

      await startAnalysis(chartText.trim(), questions);
    } catch (e) {
      console.error(e);
      fail(
        e instanceof Error ? e.message : "Could not read PDF or start analysis.",
      );
    } finally {
      setExtractBusy(false);
    }
  }

  function handleStartOver() {
    reset();
    resetToIdle();
    confettiRunRef.current = null;
    setSessionQuestions([]);
    setChartFile(null);
    setQuestionnaireFile(null);
    setQuestionnaireText("");
    setQuestionnaireTab("upload");
    setRunKey((k) => k + 1);
  }

  function handleTryAgain() {
    reset();
    resetToIdle();
  }

  const showUploadSection = state === "idle" || state === "analyzing";
  const showThinking =
    state === "analyzing" || state === "complete";
  const showResults = state === "complete";
  const showError = state === "error";
  const showAnalyzeRow = state === "idle" || state === "analyzing";

  return (
    <div className="relative mx-auto w-full max-w-6xl px-6 py-8 md:px-8 md:py-10">
      <AnalysisProgressBar mode={progressMode} />

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          New prior authorization
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {state === "complete"
            ? "Review answers below, then copy or export for submission."
            : state === "error"
              ? "Something went wrong. You can try again or contact support."
              : "Upload the patient chart and payer questionnaire to analyze requirements."}
        </p>
      </header>

      {showUploadSection && (
        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-6"
          animate={
            state === "analyzing"
              ? { scale: 0.97, opacity: 0.6 }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.section
            className="flex min-w-0 flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: state === "idle" ? 0 : 0,
              ease: "easeOut",
            }}
          >
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Patient Chart
            </h2>
            <DropZone
              id="patient-chart"
              value={chartFile}
              onChange={setChartFile}
              disabled={uploadsLocked}
            />
          </motion.section>

          <motion.section
            className="flex min-w-0 flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: state === "idle" ? 0.1 : 0,
              ease: "easeOut",
            }}
          >
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Payer Questionnaire
            </h2>
            <QuestionnaireInput
              tab={questionnaireTab}
              onTabChange={setQuestionnaireTab}
              file={questionnaireFile}
              onFileChange={setQuestionnaireFile}
              pastedText={questionnaireText}
              onPastedTextChange={setQuestionnaireText}
              disabled={uploadsLocked}
            />
          </motion.section>
        </motion.div>
      )}

      {showAnalyzeRow && (
        <motion.div
          className="mx-auto mt-10 flex w-full max-w-xl flex-col items-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: state === "idle" ? 0.2 : 0,
            ease: "easeOut",
          }}
        >
          <button
            type="button"
            disabled={!canAnalyze || state === "analyzing"}
            onClick={() => void handleAnalyze()}
            className={cn(
              "flex h-[52px] w-full items-center justify-center gap-2 rounded-xl px-6 font-display text-base font-semibold text-primary-foreground transition-all duration-150",
              "bg-primary shadow-none",
              "hover:bg-primary/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              (!canAnalyze || state === "analyzing") &&
                "cursor-not-allowed opacity-45 hover:bg-primary",
            )}
          >
            {state === "analyzing" ? (
              <>
                <Loader2
                  className="h-5 w-5 shrink-0 animate-spin text-primary-foreground/90"
                  aria-hidden
                />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <Sparkles
                  className="h-5 w-5 shrink-0 text-primary-foreground/90"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>Analyze PA</span>
              </>
            )}
          </button>

          {state === "idle" && (
            <p className="mt-4 flex max-w-lg items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
              <Lock
                className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70"
                aria-hidden
              />
              <span>
                Chart data stays in your session and is never stored or used for
                training. HIPAA-compliant.
              </span>
            </p>
          )}
        </motion.div>
      )}

      {showError && errorMessage && (
        <div
          className="mx-auto mt-10 w-full max-w-lg rounded-xl border-2 border-destructive/40 bg-destructive/[0.06] px-5 py-5 shadow-none"
          role="alert"
        >
          <div className="flex gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-foreground">
                Analysis couldn&apos;t finish
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {errorMessage}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Try Again
                </button>
                <a
                  href="mailto:support@clearpa.example"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 font-display text-sm font-medium text-foreground hover:bg-muted"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showThinking && (
        <motion.div
          key={runKey}
          className="mx-auto mt-8 w-full max-w-6xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <ThinkingPanel
            steps={thinkingSteps}
            isAnalyzing={isAnalyzing}
            isComplete={isComplete}
            elapsedSeconds={elapsedSeconds}
            isPending={state === "analyzing" && extractBusy && !isAnalyzing}
            runKey={runKey}
          />
        </motion.div>
      )}

      {showResults && (
        <div className="mx-auto mt-6 w-full max-w-6xl">
          <ResultsPanel
            isComplete={isComplete}
            questions={sessionQuestions}
            answers={answers}
            onStartOver={handleStartOver}
          />
        </div>
      )}
    </div>
  );
}
