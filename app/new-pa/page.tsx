"use client";

import { useMemo, useState } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";

import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ThinkingPanel } from "@/components/analysis/ThinkingPanel";
import { DropZone } from "@/components/upload/DropZone";
import {
  QuestionnaireInput,
  type QuestionnaireTab,
} from "@/components/upload/QuestionnaireInput";
import { useAnalysis } from "@/hooks/useAnalysis";
import { extractPdfText } from "@/lib/pdf/extractText";
import { cn } from "@/lib/utils";

export default function NewPAPage() {
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [questionnaireTab, setQuestionnaireTab] =
    useState<QuestionnaireTab>("upload");
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [extractBusy, setExtractBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<string[]>([]);

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

  async function handleAnalyze() {
    if (!canAnalyze || isAnalyzing || extractBusy) return;
    if (!chartFile) return;

    setExtractBusy(true);
    setPdfError(null);
    setRunKey((k) => k + 1);

    try {
      const chartText = await extractPdfText(chartFile);

      let questions: string | string[];
      if (questionnaireTab === "upload") {
        if (!questionnaireFile) return;
        const qText = await extractPdfText(questionnaireFile);
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

      await startAnalysis(chartText, questions);
    } catch (e) {
      console.error(e);
      setPdfError(
        e instanceof Error ? e.message : "Could not read PDF or start analysis.",
      );
    } finally {
      setExtractBusy(false);
    }
  }

  function handleStartOver() {
    reset();
    setSessionQuestions([]);
    setChartFile(null);
    setQuestionnaireFile(null);
    setQuestionnaireText("");
    setQuestionnaireTab("upload");
    setPdfError(null);
    setRunKey((k) => k + 1);
  }

  const busy = isAnalyzing || extractBusy;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          New prior authorization
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload the patient chart and payer questionnaire to analyze requirements.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-6">
        <section className="flex min-w-0 flex-col">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Patient Chart
          </h2>
          <DropZone
            id="patient-chart"
            value={chartFile}
            onChange={setChartFile}
          />
        </section>

        <section className="flex min-w-0 flex-col">
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
          />
        </section>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-center">
        <button
          type="button"
          disabled={!canAnalyze || busy}
          onClick={() => void handleAnalyze()}
          className={cn(
            "flex h-[52px] w-full items-center justify-center gap-2 rounded-xl px-6 font-display text-base font-semibold text-primary-foreground transition-all duration-150",
            "bg-primary shadow-none",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            (!canAnalyze || busy) &&
              "cursor-not-allowed opacity-45 hover:bg-primary",
          )}
        >
          {busy ? (
            <>
              <Loader2
                className="h-5 w-5 shrink-0 animate-spin text-primary-foreground/90"
                aria-hidden
              />
              <span>
                {extractBusy && !isAnalyzing
                  ? "Reading PDFs…"
                  : "Analyzing chart…"}
              </span>
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
      </div>

      {(error || pdfError) && (
        <div
          className="mx-auto mt-6 w-full max-w-3xl rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive"
          role="alert"
        >
          {error ?? pdfError}
        </div>
      )}

      <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-6">
        <ThinkingPanel
          steps={thinkingSteps}
          isAnalyzing={isAnalyzing}
          isComplete={isComplete}
          elapsedSeconds={elapsedSeconds}
          runKey={runKey}
        />
        <ResultsPanel
          isComplete={isComplete}
          questions={sessionQuestions}
          answers={answers}
          onStartOver={handleStartOver}
        />
      </div>
    </div>
  );
}
