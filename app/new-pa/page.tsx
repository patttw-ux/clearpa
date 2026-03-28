"use client";

import { useMemo, useState } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";

import { DropZone } from "@/components/upload/DropZone";
import {
  QuestionnaireInput,
  type QuestionnaireTab,
} from "@/components/upload/QuestionnaireInput";
import { cn } from "@/lib/utils";

export default function NewPAPage() {
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [questionnaireTab, setQuestionnaireTab] =
    useState<QuestionnaireTab>("upload");
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  function handleAnalyze() {
    if (!canAnalyze || isAnalyzing) return;
    setIsAnalyzing(true);
    // Placeholder until API wiring — keeps UI in loading state briefly
    window.setTimeout(() => {
      setIsAnalyzing(false);
    }, 2200);
  }

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
          disabled={!canAnalyze || isAnalyzing}
          onClick={handleAnalyze}
          className={cn(
            "flex h-[52px] w-full items-center justify-center gap-2 rounded-xl px-6 font-display text-base font-semibold text-primary-foreground transition-all duration-150",
            "bg-primary shadow-none",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            (!canAnalyze || isAnalyzing) &&
              "cursor-not-allowed opacity-45 hover:bg-primary",
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2
                className="h-5 w-5 shrink-0 animate-spin text-primary-foreground/90"
                aria-hidden
              />
              <span>Analyzing chart…</span>
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
    </div>
  );
}
