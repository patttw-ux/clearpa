"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Check, FileUp, X } from "lucide-react";

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
  className?: string;
};

export function DropZone({ id, value, onChange, className }: DropZoneProps) {
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
  });

  const remove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  if (value) {
    return (
      <div
        {...getRootProps({
          className: cn(
            "flex cursor-pointer items-center justify-between gap-3 rounded-full border border-border bg-card px-4 py-2.5 transition-colors duration-150 hover:border-primary/40 hover:bg-muted/30",
            isDragActive && "scale-[1.01] border-solid border-primary",
            className,
          ),
        })}
      >
        <input {...getInputProps({ id })} />
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Check
            className="h-5 w-5 shrink-0 text-primary"
            strokeWidth={2.5}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-medium text-foreground">
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps({
        className: cn(
          "flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 transition-all duration-150 ease-out",
          "hover:border-primary hover:bg-primary/[0.03]",
          isDragActive && "scale-[1.01] border-solid border-primary bg-primary/[0.04]",
          className,
        ),
      })}
    >
      <input {...getInputProps({ id })} />
      <FileUp
        className="h-12 w-12 text-muted-foreground/80"
        strokeWidth={1.25}
        aria-hidden
      />
      <p className="mt-4 font-display text-base font-medium text-foreground">
        Drop PDF here
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground">or click to browse</p>
      <span className="mt-4 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
        PDF only · max 1 file
      </span>
    </div>
  );
}
