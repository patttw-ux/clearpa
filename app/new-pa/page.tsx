"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  Loader2,
  Lock,
  Sparkles,
  X,
} from "lucide-react";

import { ResultsPanel } from "@/components/results/ResultsPanel";
import { SaveSessionDialog } from "@/components/sessions/SaveSessionDialog";
import { ThinkingPanel } from "@/components/analysis/ThinkingPanel";
import { DropZone } from "@/components/upload/DropZone";
import {
  QuestionnaireInput,
  type QuestionnaireTab,
} from "@/components/upload/QuestionnaireInput";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useWorkflow, type WorkflowState } from "@/hooks/useWorkflow";
import { DEMO_CHART_TEXT, DEMO_QUESTIONS } from "@/lib/demo-data";
import { detectPayer, detectPayerFromFilename } from "@/lib/payer-detector";
import { extractPdfViaApi } from "@/lib/pdf/extractPdfApi";
import type { SessionSavePayload } from "@/lib/types/pa-session";
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
  const [saveSessionOpen, setSaveSessionOpen] = useState(false);
  const [saveSessionPayload, setSaveSessionPayload] =
    useState<SessionSavePayload | null>(null);
  const [detectedPayer, setDetectedPayer] = useState<string | null>(null);
  const [chartPages, setChartPages] = useState<number | null>(null);
  const [questionnairePages, setQuestionnairePages] = useState<number | null>(
    null,
  );

  const confettiRunRef = useRef<number | null>(null);

  const {
    thinkingSteps,
    answers,
    isAnalyzing,
    isComplete,
    error,
    elapsedSeconds,
    startAnalysis,
    runDemoSimulation,
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

  useEffect(() => {
    if (questionnaireTab !== "paste") return;
    setDetectedPayer(detectPayer(questionnaireText));
  }, [questionnaireTab, questionnaireText]);

  useEffect(() => {
    if (!chartFile) {
      setChartPages(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { pages } = await extractPdfViaApi(chartFile);
        if (cancelled) return;
        setChartPages(pages > 0 ? pages : null);
      } catch {
        if (!cancelled) setChartPages(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chartFile]);

  useEffect(() => {
    if (questionnaireTab !== "upload") {
      setQuestionnairePages(null);
      return;
    }
    if (!questionnaireFile) {
      setDetectedPayer(null);
      setQuestionnairePages(null);
      return;
    }
    setDetectedPayer(detectPayerFromFilename(questionnaireFile.name));
    let cancelled = false;
    void (async () => {
      try {
        const { text: extractedText, pages } =
          await extractPdfViaApi(questionnaireFile);
        if (cancelled) return;
        setQuestionnairePages(pages > 0 ? pages : null);
        const payerFromText = detectPayer(extractedText);
        const payerFromFile = detectPayerFromFilename(questionnaireFile.name);
        setDetectedPayer(payerFromText ?? payerFromFile);
      } catch {
        if (!cancelled) {
          setDetectedPayer(
            detectPayerFromFilename(questionnaireFile.name),
          );
          setQuestionnairePages(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [questionnaireTab, questionnaireFile]);

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

  /** When questionnaire is a PDF only, question labels are derived after analysis from answer indices. */
  const resultsQuestions = useMemo(() => {
    if (sessionQuestions.length > 0) return sessionQuestions;
    if (
      state === "complete" &&
      answers.length > 0 &&
      questionnaireTab === "upload" &&
      questionnaireFile
    ) {
      const max = Math.max(...answers.map((a) => a.questionIndex), 0);
      return Array.from({ length: max + 1 }, (_, i) => `Question ${i + 1}`);
    }
    return sessionQuestions;
  }, [
    sessionQuestions,
    state,
    answers,
    questionnaireTab,
    questionnaireFile,
  ]);

  const saveSummary = useMemo(() => {
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

  const handleSaveSession = useCallback((payload: SessionSavePayload) => {
    setSaveSessionPayload(payload);
    setSaveSessionOpen(true);
  }, []);

  const uploadsLocked = state === "analyzing";

  async function handleAnalyze() {
    if (state !== "idle" || !canAnalyze || extractBusy) return;
    if (!chartFile) return;

    reset();
    beginAnalysis();
    setRunKey((k) => k + 1);
    setExtractBusy(true);

    try {
      let qList: string[];
      if (questionnaireTab === "upload") {
        if (!questionnaireFile) return;
        qList = [];
      } else {
        const raw = questionnaireText.trim();
        const lines = raw.split("\n").map((s) => s.trim()).filter(Boolean);
        qList = lines.length > 0 ? lines : [raw];
      }

      setSessionQuestions(qList);

      await startAnalysis({
        chartFile,
        questions: qList,
        questionnaireFile:
          questionnaireTab === "upload" ? questionnaireFile : null,
        questionnaireText:
          questionnaireTab === "paste" ? questionnaireText : undefined,
      });
    } catch (e) {
      console.error(e);
      fail(
        e instanceof Error ? e.message : "Could not read PDF or start analysis.",
      );
    } finally {
      setExtractBusy(false);
    }
  }

  function handleTryDemo() {
    if (state !== "idle") return;
    reset();
    beginAnalysis();
    setRunKey((k) => k + 1);
    setSessionQuestions([...DEMO_QUESTIONS]);
    setQuestionnaireTab("paste");
    const demoText = DEMO_QUESTIONS.join("\n");
    setQuestionnaireText(demoText);
    setDetectedPayer(detectPayer(demoText));
    setQuestionnaireFile(null);
    setChartFile(
      new File([DEMO_CHART_TEXT], "demo-chart-synthetic.pdf", {
        type: "application/pdf",
      }),
    );
    void runDemoSimulation();
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
    setDetectedPayer(null);
    setChartPages(null);
    setQuestionnairePages(null);
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

  const analyzeDisabled =
    !canAnalyze || state === "analyzing" || extractBusy;

  const analyzeButton = (
    <button
      type="button"
      disabled={analyzeDisabled}
      onClick={() => void handleAnalyze()}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-2 rounded-xl px-6 font-display text-base font-semibold text-primary-foreground",
        "bg-primary shadow-none transition-all duration-150 ease-out",
        analyzeDisabled
          ? "cursor-not-allowed hover:brightness-100"
          : "hover:brightness-[0.92]",
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
      ) : !canAnalyze ? (
        <>
          <Lock
            className="h-5 w-5 shrink-0 text-primary-foreground/90"
            strokeWidth={2}
            aria-hidden
          />
          <span>Complete both steps to analyze</span>
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
  );

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-6xl px-6 md:px-8",
        showAnalyzeRow && state === "idle" && "pb-40 md:pb-10",
        showAnalyzeRow && state === "analyzing" && "pb-40 md:pb-10",
      )}
    >
      <AnalysisProgressBar mode={progressMode} />

      <div className="mx-auto w-full max-w-4xl pt-16">
        <header className={cn("mb-10", state !== "idle" && "max-w-2xl")}>
          {state === "idle" ? (
            <>
              <h1 className="font-display text-[32px] font-bold leading-tight tracking-tight text-foreground">
                Prior Authorization Assistant
              </h1>
              <p className="mt-2 font-display text-[15px] font-normal leading-snug text-muted-foreground">
                Upload a chart and questionnaire. Get answers in seconds.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {state === "complete"
                  ? "Review & submit"
                  : state === "error"
                    ? "New prior authorization"
                    : "Prior Authorization Assistant"}
              </h1>
              <p className="mt-2 text-sm leading-snug text-muted-foreground">
                {state === "complete"
                  ? "Review answers below, then copy or export for submission."
                  : state === "error"
                    ? "Something went wrong. You can try again or contact support."
                    : state === "analyzing"
                      ? "Analyzing chart and questionnaire."
                      : "Upload the patient chart and payer questionnaire to analyze requirements."}
              </p>
            </>
          )}
        </header>

        {showUploadSection && (
          <motion.div
            className="flex flex-col md:flex-row md:items-stretch"
            animate={
              state === "analyzing"
                ? { scale: 0.97, opacity: 0.6 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.section
              className="relative flex min-h-[260px] min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-card md:min-h-[280px]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: state === "idle" ? 0 : 0,
                ease: "easeOut",
              }}
            >
              <span
                className="pointer-events-none absolute bottom-4 right-4 z-0 select-none font-display text-[48px] font-bold leading-none text-primary opacity-[0.06]"
                aria-hidden
              >
                1
              </span>
              {chartFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!uploadsLocked) setChartFile(null);
                  }}
                  disabled={uploadsLocked}
                  className="absolute right-3 top-3 z-[1] flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-150 ease-out hover:bg-destructive/10 hover:text-foreground disabled:pointer-events-none"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
              <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                <div className="px-5 pt-5">
                  <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Patient chart
                  </p>
                </div>
                <DropZone
                  id="patient-chart"
                  value={chartFile}
                  onChange={setChartFile}
                  disabled={uploadsLocked}
                  hideRemoveButton
                  pageCount={chartPages}
                  className="relative z-[1] flex flex-1 flex-col"
                />
              </div>
            </motion.section>

            <div
              className="flex h-8 shrink-0 items-center justify-center md:hidden"
              aria-hidden
            >
              <div className="h-px flex-1 bg-[#e5e7eb]" />
              <span className="px-3 font-display text-xs text-muted-foreground">
                +
              </span>
              <div className="h-px flex-1 bg-[#e5e7eb]" />
            </div>

            <div
              className="relative hidden w-10 shrink-0 self-stretch md:flex md:flex-col md:items-center md:justify-center"
              aria-hidden
            >
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#e5e7eb]" />
              <span className="relative z-[1] bg-background px-1 font-display text-xs text-muted-foreground">
                +
              </span>
            </div>

            <motion.section
              className="relative flex min-h-[260px] min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-card md:min-h-[280px]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: state === "idle" ? 0.1 : 0,
                ease: "easeOut",
              }}
            >
              <span
                className="pointer-events-none absolute bottom-4 right-4 z-0 select-none font-display text-[48px] font-bold leading-none text-primary opacity-[0.06]"
                aria-hidden
              >
                2
              </span>
              {questionnaireTab === "upload" && questionnaireFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!uploadsLocked) setQuestionnaireFile(null);
                  }}
                  disabled={uploadsLocked}
                  className="absolute right-3 top-3 z-[1] flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-150 ease-out hover:bg-destructive/10 hover:text-foreground disabled:pointer-events-none"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
              <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                <QuestionnaireInput
                  tab={questionnaireTab}
                  onTabChange={setQuestionnaireTab}
                  file={questionnaireFile}
                  onFileChange={setQuestionnaireFile}
                  pastedText={questionnaireText}
                  onPastedTextChange={setQuestionnaireText}
                  disabled={uploadsLocked}
                  variant="clinical"
                  hideRemoveOnDropZone
                  pageCount={questionnairePages}
                />
              </div>
            </motion.section>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showAnalyzeRow && detectedPayer ? (
            <motion.div
              key="detected-payer"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-6 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                <Building2
                  className="h-3.5 w-3.5 shrink-0 text-primary"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-sm font-medium text-foreground">
                  Detected: {detectedPayer}
                </span>
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent"
                  aria-hidden
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {showAnalyzeRow && (
          <motion.div
            className="mt-8 w-full md:mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: state === "idle" ? 0.2 : 0,
              ease: "easeOut",
            }}
          >
            <div
              className={cn(
                "md:static",
                "fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border/40 bg-background/95 px-4 pb-3 pt-3 backdrop-blur-sm md:inset-auto md:bottom-auto md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
              )}
            >
              <div className="mx-auto w-full max-w-4xl">{analyzeButton}</div>
            </div>

            {state === "idle" && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="font-display text-[13px] text-muted-foreground underline-offset-4 transition-all duration-150 ease-out hover:underline"
                >
                  or try a demo →
                </button>
              </div>
            )}

            {state === "idle" && (
              <p className="mt-10 text-center font-display text-[11px] text-muted-foreground">
                Session only · Never stored · HIPAA-eligible
              </p>
            )}
          </motion.div>
        )}
      </div>

      {showError && errorMessage && (
        <div
          className="error-surface mx-auto mt-10 w-full max-w-lg border border-red-200/80 px-5 py-5 shadow-none"
          role="alert"
        >
          <div className="flex gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-[#991b1b]"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-[#991b1b]">
                Analysis couldn&apos;t finish
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#991b1b]/90">
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
            questions={resultsQuestions}
            answers={answers}
            onStartOver={handleStartOver}
            runKey={runKey}
            autoPromptSave={state === "complete"}
            onSaveSession={handleSaveSession}
          />
        </div>
      )}

      <SaveSessionDialog
        open={saveSessionOpen}
        onOpenChange={setSaveSessionOpen}
        payload={saveSessionPayload}
        summary={saveSummary}
        defaultPayer={detectedPayer ?? undefined}
      />
    </div>
  );
}
