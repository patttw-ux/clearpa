"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Clock, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "clearpa_settings";

type PracticeSettings = {
  practiceName: string;
  ehrSystem: string;
  specialty: string;
};

const DEFAULTS: PracticeSettings = {
  practiceName: "San Jose Eye Institute",
  ehrSystem: "ModMed",
  specialty: "Ophthalmology",
};

function parseStored(raw: string | null): PracticeSettings {
  if (!raw) return { ...DEFAULTS };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      practiceName:
        typeof o.practiceName === "string"
          ? o.practiceName
          : DEFAULTS.practiceName,
      ehrSystem:
        typeof o.ehrSystem === "string" ? o.ehrSystem : DEFAULTS.ehrSystem,
      specialty:
        typeof o.specialty === "string" ? o.specialty : DEFAULTS.specialty,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function loadFromStorage(): PracticeSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none ring-offset-background focus:border-primary focus:outline-none focus-visible:ring-0";

export default function SettingsPage() {
  const [values, setValues] = useState<PracticeSettings>(DEFAULTS);
  const [draft, setDraft] = useState<PracticeSettings>(DEFAULTS);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage();
    setValues(loaded);
    setDraft(loaded);
    setHydrated(true);
  }, []);

  const startEdit = useCallback(() => {
    setDraft({ ...values });
    setIsEditing(true);
  }, [values]);

  const cancelEdit = useCallback(() => {
    setDraft({ ...values });
    setIsEditing(false);
  }, [values]);

  const openSaveConfirm = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const commitSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setValues({ ...draft });
      setIsEditing(false);
      setConfirmOpen(false);
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings.");
    }
  }, [draft]);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pb-16 pt-10">
      <header>
        <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm leading-normal text-muted-foreground">
          Practice configuration and preferences.
        </p>
        <div className="mt-6 border-b border-border" aria-hidden />
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <section className="rounded-xl border border-border bg-white p-6 dark:bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Building2
                className="h-5 w-5 shrink-0 text-primary"
                strokeWidth={2}
                aria-hidden
              />
              <h2 className="font-display text-[15px] font-semibold text-foreground">
                Practice Information
              </h2>
            </div>
            {!isEditing ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 font-display text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 font-display text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Cancel
              </button>
            )}
          </div>
          <div className="my-4 border-t border-border" />
          <div>
            <div className="border-b border-border py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Practice name
              </p>
              {isEditing ? (
                <input
                  className={cn("mt-1", inputClass)}
                  value={draft.practiceName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, practiceName: e.target.value }))
                  }
                  aria-label="Practice name"
                />
              ) : (
                <p className="mt-1 font-display text-sm text-foreground">
                  {hydrated ? values.practiceName : DEFAULTS.practiceName}
                </p>
              )}
            </div>
            <div className="border-b border-border py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                EHR system
              </p>
              {isEditing ? (
                <input
                  className={cn("mt-1", inputClass)}
                  value={draft.ehrSystem}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, ehrSystem: e.target.value }))
                  }
                  aria-label="EHR system"
                />
              ) : (
                <p className="mt-1 font-display text-sm text-foreground">
                  {hydrated ? values.ehrSystem : DEFAULTS.ehrSystem}
                </p>
              )}
            </div>
            <div className="py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Specialty
              </p>
              {isEditing ? (
                <input
                  className={cn("mt-1", inputClass)}
                  value={draft.specialty}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, specialty: e.target.value }))
                  }
                  aria-label="Specialty"
                />
              ) : (
                <p className="mt-1 font-display text-sm text-foreground">
                  {hydrated ? values.specialty : DEFAULTS.specialty}
                </p>
              )}
            </div>
          </div>

          {isEditing ? (
            <button
              type="button"
              onClick={openSaveConfirm}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 font-display text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save changes
            </button>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-white p-6 dark:bg-card">
          <div className="flex items-center gap-2">
            <Clock
              className="h-5 w-5 shrink-0 text-primary"
              strokeWidth={2}
              aria-hidden
            />
            <h2 className="font-display text-[15px] font-semibold text-foreground">
              Coming Soon
            </h2>
          </div>
          <div className="my-4 border-t border-border" />
          <ul className="space-y-2.5 text-[13px] leading-snug text-muted-foreground">
            <li className="flex gap-2">
              <span className="select-none text-foreground/70" aria-hidden>
                ·
              </span>
              <span>EHR direct integration (ModMed, Epic, Athena)</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none text-foreground/70" aria-hidden>
                ·
              </span>
              <span>Payer rules library with auto-updates</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none text-foreground/70" aria-hidden>
                ·
              </span>
              <span>Team accounts and role management</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none text-foreground/70" aria-hidden>
                ·
              </span>
              <span>Approval rate tracking by payer</span>
            </li>
            <li className="flex gap-2">
              <span className="select-none text-foreground/70" aria-hidden>
                ·
              </span>
              <span>Automated reauthorization reminders</span>
            </li>
          </ul>
        </section>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update your practice information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-0 bg-transparent font-display text-muted-foreground shadow-none hover:bg-muted hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={commitSave} className="font-display">
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
