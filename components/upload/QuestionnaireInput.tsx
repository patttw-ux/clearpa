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
  disabled?: boolean;
  className?: string;
  /** Minimal chrome: parent supplies card border; use on New PA clinical layout */
  variant?: "default" | "clinical";
  /** Parent renders remove on card; hide DropZone remove */
  hideRemoveOnDropZone?: boolean;
  /** PDF page count from extraction; shown on uploaded file card */
  pageCount?: number | null;
};

export function QuestionnaireInput({
  tab,
  onTabChange,
  file,
  onFileChange,
  pastedText,
  onPastedTextChange,
  disabled = false,
  className,
  variant = "default",
  hideRemoveOnDropZone = false,
  pageCount = null,
}: QuestionnaireInputProps) {
  const clinical = variant === "clinical";

  return (
    <div
      className={cn(
        !clinical && "rounded-xl border border-border bg-card p-5 shadow-none",
        clinical && "flex min-h-0 flex-1 flex-col pb-4",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {clinical && (
        <p className="px-5 pt-4 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Payer questionnaire
        </p>
      )}

      <div
        className={cn(
          "flex",
          clinical
            ? "gap-8 border-b border-border px-5"
            : "gap-0 border-b border-border",
        )}
        role="tablist"
        aria-label="Questionnaire source"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upload"}
          disabled={disabled}
          className={cn(
            "font-display text-[13px] transition-all duration-150 ease-out",
            clinical
              ? cn(
                  "relative -mb-px border-b-2 pb-2.5 pt-3",
                  tab === "upload"
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent font-normal text-muted-foreground hover:text-foreground",
                )
              : cn(
                  "relative flex-1 pb-3 pt-1 text-center text-sm font-medium",
                  tab === "upload"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ),
          )}
          onClick={() => onTabChange("upload")}
        >
          Upload PDF
          {!clinical && tab === "upload" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "paste"}
          disabled={disabled}
          className={cn(
            "font-display text-[13px] transition-all duration-150 ease-out",
            clinical
              ? cn(
                  "relative -mb-px border-b-2 pb-2.5 pt-3",
                  tab === "paste"
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent font-normal text-muted-foreground hover:text-foreground",
                )
              : cn(
                  "relative flex-1 pb-3 pt-1 text-center text-sm font-medium",
                  tab === "paste"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ),
          )}
          onClick={() => onTabChange("paste")}
        >
          Paste questions
          {!clinical && tab === "paste" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      <div
        className={cn(
          !clinical && "mt-5",
          clinical && "relative z-[1] flex min-h-0 flex-1 flex-col",
        )}
      >
        {tab === "upload" ? (
          <DropZone
            id="questionnaire-pdf"
            value={file}
            onChange={onFileChange}
            disabled={disabled}
            hideRemoveButton={hideRemoveOnDropZone}
            pageCount={pageCount}
            className={clinical ? "flex-1" : undefined}
          />
        ) : (
          <label className={cn("block", clinical && "px-5 pt-4")}>
            <span className="sr-only">Paste questionnaire text</span>
            <textarea
              value={pastedText}
              onChange={(e) => onPastedTextChange(e.target.value)}
              disabled={disabled}
              placeholder="Paste payer questions here (one section or full questionnaire)…"
              className={cn(
                "min-h-[200px] w-full resize-y border border-border bg-background px-3 py-3 text-sm leading-relaxed text-foreground",
                clinical ? "rounded-lg" : "rounded-xl",
                "placeholder:text-muted-foreground/70",
                "outline-none ring-offset-background transition-all duration-150 ease-out",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
              spellCheck
            />
          </label>
        )}
      </div>
    </div>
  );
}
