"use client";

import { cn } from "@/lib/utils";

import { DropZone } from "./DropZone";

export type QuestionnaireTab = "upload" | "paste";

export type QuestionnaireInputProps = {
  tab: QuestionnaireTab;
  onTabChange: (tab: QuestionnaireTab) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  className?: string;
};

export function QuestionnaireInput({
  tab,
  onTabChange,
  file,
  onFileChange,
  pastedText,
  onPastedTextChange,
  className,
}: QuestionnaireInputProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-none",
        className,
      )}
    >
      <div
        className="flex gap-0 border-b border-border"
        role="tablist"
        aria-label="Questionnaire source"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upload"}
          className={cn(
            "relative flex-1 pb-3 pt-1 text-center font-display text-sm font-medium transition-colors duration-150",
            tab === "upload"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onTabChange("upload")}
        >
          Upload PDF
          {tab === "upload" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "paste"}
          className={cn(
            "relative flex-1 pb-3 pt-1 text-center font-display text-sm font-medium transition-colors duration-150",
            tab === "paste"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onTabChange("paste")}
        >
          Paste Questions
          {tab === "paste" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      <div className="mt-5">
        {tab === "upload" ? (
          <DropZone
            id="questionnaire-pdf"
            value={file}
            onChange={onFileChange}
          />
        ) : (
          <label className="block">
            <span className="sr-only">Paste questionnaire text</span>
            <textarea
              value={pastedText}
              onChange={(e) => onPastedTextChange(e.target.value)}
              placeholder="Paste payer questions here (one section or full questionnaire)…"
              className={cn(
                "min-h-[220px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground",
                "placeholder:text-muted-foreground/70",
                "outline-none ring-offset-background transition-shadow duration-150",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30",
              )}
              spellCheck
            />
          </label>
        )}
      </div>
    </div>
  );
}
