"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getSessions, updateSessionStatus } from "@/lib/pa-sessions";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PaSessionRow, SessionStatus } from "@/lib/types/pa-session";
import { cn } from "@/lib/utils";

const STATUSES: SessionStatus[] = [
  "complete",
  "submitted",
  "approved",
  "denied",
];

function statusLabel(s: SessionStatus): string {
  switch (s) {
    case "complete":
      return "Complete";
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    default:
      return s;
  }
}

function StatusBadge({
  sessionId,
  status,
  onUpdated,
}: {
  sessionId: string;
  status: SessionStatus | null;
  onUpdated: () => void;
}) {
  const current = status ?? "complete";
  const styles: Record<SessionStatus, string> = {
    complete:
      "border-border bg-muted/80 text-muted-foreground hover:bg-muted",
    submitted:
      "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
    approved:
      "border-accent/30 bg-accent/15 text-accent hover:bg-accent/20",
    denied:
      "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
  };

  const update = useCallback(
    async (next: SessionStatus) => {
      if (next === current) return;
      try {
        await updateSessionStatus(sessionId, next);
        toast.success(`Status updated to ${statusLabel(next)}`);
        onUpdated();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update status");
      }
    },
    [current, onUpdated, sessionId],
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-w-[7rem] items-center justify-center rounded-full border px-2.5 py-1 font-display text-xs font-medium transition-colors",
            styles[current],
          )}
        >
          {statusLabel(current)}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[10rem] rounded-lg border border-border bg-popover p-1 shadow-md"
          sideOffset={4}
          align="start"
        >
          {STATUSES.map((s) => (
            <DropdownMenu.Item
              key={s}
              className="cursor-pointer rounded-md px-2 py-1.5 font-display text-sm outline-none hover:bg-muted focus:bg-muted"
              onSelect={() => void update(s)}
            >
              {statusLabel(s)}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const [rows, setRows] = useState<PaSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setError("not_configured");
      setRows([]);
      return;
    }
    setError(null);
    getSessions()
      .then(setRows)
      .catch((e: Error) => {
        setError(e.message);
        setRows([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (rows === null && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error === "not_configured") {
    return (
      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Session history
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Add{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to your environment, run the migration, then reload.
        </p>
      </div>
    );
  }

  if (error && error !== "not_configured") {
    return (
      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Session history
        </h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => {
            setRows(null);
            load();
          }}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  const list = rows ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Session history
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review saved prior authorizations. Use initials only — never full
          patient names.
        </p>
      </header>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <ClipboardList className="h-10 w-10" strokeWidth={1.25} aria-hidden />
          </div>
          <p className="mt-6 max-w-sm font-display text-base font-medium text-foreground">
            No sessions yet.
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Complete your first PA to see history here. After analysis, use{" "}
            <span className="font-medium text-foreground">Save session</span>{" "}
            to store a row in Supabase.
          </p>
          <Link
            href="/new-pa"
            className="mt-8 inline-flex h-10 items-center rounded-xl bg-primary px-5 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            New PA
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Payer</th>
                <th className="px-4 py-3">Drug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Counts</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/80 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.patient_initials ?? "—"}
                  </td>
                  <td className="px-4 py-3">{row.payer_name ?? "—"}</td>
                  <td className="px-4 py-3">{row.drug_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      sessionId={row.id}
                      status={row.status as SessionStatus | null}
                      onUpdated={load}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {row.answered_count ?? 0} ans / {row.flagged_count ?? 0} flag
                    {row.warning_count ? ` / ${row.warning_count} warn` : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/history/${row.id}`}
                      className="font-display text-sm font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
