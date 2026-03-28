"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileCheck2, X } from "lucide-react";

import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type DropZoneProps = {
  id?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  /** Disables drop, file input, and remove */
  disabled?: boolean;
  className?: string;
  /** When true, no remove control (parent places control on the card) */
  hideRemoveButton?: boolean;
};

export function DropZone({
  id,
  value,
  onChange,
  disabled = false,
  className,
  hideRemoveButton = false,
}: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const next = acceptedFiles[0];
      if (next) onChange(next);
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  const remove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) onChange(null);
  };

  if (value) {
    return (
      <div
        {...getRootProps({
          className: cn(
            "relative z-[1] flex min-h-[200px] cursor-pointer flex-col items-center justify-center px-6 py-8 transition-colors duration-150 ease-out",
            isDragActive && "bg-muted/20",
            disabled && "pointer-events-none cursor-not-allowed opacity-60",
            className,
          ),
        })}
      >
        <input {...getInputProps({ id })} />
        {!hideRemoveButton && (
          <button
            type="button"
            onClick={remove}
            disabled={disabled}
            className="absolute right-3 top-3 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-150 ease-out hover:bg-destructive/10 hover:text-foreground disabled:pointer-events-none"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
        <div className="flex max-w-full flex-col items-center justify-center gap-2 text-center">
          <FileCheck2
            className="h-5 w-5 shrink-0 text-accent"
            strokeWidth={2}
            aria-hidden
          />
          <p className="max-w-[200px] truncate font-mono text-sm text-foreground">
            {value.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(value.size)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps({
        className: cn(
          "relative z-[1] flex min-h-[200px] cursor-pointer flex-col items-center justify-center px-6 py-10 text-center transition-colors duration-150 ease-out",
          isDragActive && "bg-muted/15",
          disabled && "pointer-events-none cursor-not-allowed opacity-60",
          className,
        ),
      })}
    >
      <input {...getInputProps({ id })} />
      <p className="font-display text-base font-medium text-foreground">
        Drop PDF
      </p>
      <p className="mt-1 font-display text-[13px] text-muted-foreground underline decoration-muted-foreground/50 underline-offset-4">
        or browse files
      </p>
    </div>
  );
}
