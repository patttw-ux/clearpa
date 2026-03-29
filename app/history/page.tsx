"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowRight,
  ClipboardList,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteSessions,
  getSessions,
  updateSessionStatus,
} from "@/lib/pa-sessions";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PaSessionRow, SessionStatus } from "@/lib/types/pa-session";
import { cn } from "@/lib/utils";

const STATUSES: SessionStatus[] = [
  "complete",
  "submitted",
  "approved",
  "denied",
];

type DateRangeKey = "all" | "today" | "7d" | "30d";
type SortKey = "newest" | "oldest" | "answered" | "flagged";

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

function displayPayer(r: PaSessionRow): string {
  const t = r.payer_name?.trim();
  return t ? t : "—";
}

function displayDrug(r: PaSessionRow): string {
  const t = r.drug_name?.trim();
  return t ? t : "—";
}

function drugPillClass(drugLabel: string): string {
  const n = drugLabel.toLowerCase();
  if (n.includes("cequa")) {
    return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }
  if (n.includes("xiidra")) {
    return "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300";
  }
  return "border-border text-muted-foreground";
}

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function matchesDateRange(createdAt: string, range: DateRangeKey): boolean {
  if (range === "all") return true;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return t >= start.getTime() && t < end.getTime();
  }
  if (range === "7d") {
    return t >= now - 7 * 24 * 60 * 60 * 1000;
  }
  if (range === "30d") {
    return t >= now - 30 * 24 * 60 * 60 * 1000;
  }
  return true;
}

function sortRows(rows: PaSessionRow[], sort: SortKey): PaSessionRow[] {
  const arr = [...rows];
  switch (sort) {
    case "newest":
      return arr.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "oldest":
      return arr.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    case "answered":
      return arr.sort(
        (a, b) => (b.answered_count ?? 0) - (a.answered_count ?? 0),
      );
    case "flagged":
      return arr.sort(
        (a, b) => (b.flagged_count ?? 0) - (a.flagged_count ?? 0),
      );
    default:
      return arr;
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
      "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
    submitted:
      "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50/80 dark:border-blue-500/40 dark:bg-blue-950/50 dark:text-blue-300",
    approved:
      "border border-green-200 bg-green-50 text-green-700 hover:bg-green-50/80 dark:border-green-500/40 dark:bg-green-950/50 dark:text-green-300",
    denied:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-50/80 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-300",
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
            "inline-flex min-w-[7rem] items-center justify-center rounded-md px-2.5 py-1 font-display text-xs font-medium transition-all duration-150 ease-out",
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

function HistoryListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton-shimmer h-8 w-48 max-w-full rounded-lg" />
      <div className="skeleton-shimmer mt-2 h-10 w-full rounded-md" />
      <div className="skeleton-shimmer mt-2 h-10 w-full rounded-md" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="skeleton-shimmer h-10 w-28 shrink-0 rounded" />
            <div className="flex flex-1 gap-2">
              <div className="skeleton-shimmer h-6 w-24 rounded-full" />
              <div className="skeleton-shimmer h-6 w-20 rounded-full" />
            </div>
            <div className="skeleton-shimmer ml-auto h-8 w-40 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PaSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SessionStatus>(
    "all",
  );
  const [dateRange, setDateRange] = useState<DateRangeKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

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

  useEffect(() => {
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onDocKey);
    return () => window.removeEventListener("keydown", onDocKey);
  }, []);

  const list = useMemo(() => rows ?? [], [rows]);

  const uniquePayers = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      set.add(displayPayer(r));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((row) => {
      if (!matchesDateRange(row.created_at, dateRange)) {
        return false;
      }
      if (payerFilter !== "all" && displayPayer(row) !== payerFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        const s = (row.status ?? "complete") as SessionStatus;
        if (s !== statusFilter) return false;
      }
      if (q) {
        const initials = (row.patient_initials ?? "").toLowerCase();
        const payer = (row.payer_name ?? "").toLowerCase();
        const drug = (row.drug_name ?? "").toLowerCase();
        if (
          !initials.includes(q) &&
          !payer.includes(q) &&
          !drug.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [list, search, payerFilter, statusFilter, dateRange]);

  const sortedFiltered = useMemo(
    () => sortRows(filtered, sortKey),
    [filtered, sortKey],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setPayerFilter("all");
    setStatusFilter("all");
    setDateRange("all");
    setSortKey("newest");
    setSelectedIds([]);
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const runBulkStatus = useCallback(
    async (status: SessionStatus) => {
      if (selectedIds.length === 0) return;
      setBulkBusy(true);
      try {
        await Promise.all(
          selectedIds.map((id) => updateSessionStatus(id, status)),
        );
        toast.success(
          `${selectedIds.length} session${selectedIds.length === 1 ? "" : "s"} marked as ${statusLabel(status)}`,
        );
        clearSelection();
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update status");
      } finally {
        setBulkBusy(false);
      }
    },
    [selectedIds, load, clearSelection],
  );

  const runBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const n = selectedIds.length;
    if (
      !window.confirm(
        `Delete ${n} session${n === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      await deleteSessions(selectedIds);
      toast.success(
        `Deleted ${n} session${n === 1 ? "" : "s"}`,
      );
      clearSelection();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, load, clearSelection]);

  if (rows === null && !error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 md:py-10">
        <div className="mb-8">
          <div className="skeleton-shimmer h-9 w-64 max-w-full rounded-lg" />
          <div className="skeleton-shimmer mt-3 h-4 w-full max-w-xl rounded" />
        </div>
        <HistoryListSkeleton />
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

  const hasSelection = selectedIds.length > 0;

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-6 py-8 md:px-8 md:py-10",
        hasSelection && "pb-28",
      )}
    >
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
        <>
          <div className="mb-4 flex flex-col gap-3">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setSearch("");
                  }
                }}
                placeholder="Search patient, payer, drug..."
                className="h-10 w-full rounded-md border border-border bg-background py-2 pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                autoComplete="off"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-row flex-wrap gap-2">
              <Select value={payerFilter} onValueChange={setPayerFilter}>
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue placeholder="All payers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payers</SelectItem>
                  {uniquePayers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as "all" | SessionStatus)
                }
              >
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={dateRange}
                onValueChange={(v) => setDateRange(v as DateRangeKey)}
              >
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortKey}
                onValueChange={(v) => setSortKey(v as SortKey)}
              >
                <SelectTrigger className="min-w-0 flex-1">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="answered">Most answered</SelectItem>
                  <SelectItem value="flagged">Most flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="mb-2 text-xs text-muted-foreground">
            Showing {sortedFiltered.length} of {list.length} sessions
          </p>

          {sortedFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-8 py-14 text-center">
              <p className="font-display text-sm font-medium text-foreground">
                No sessions match your filters
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear filters"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedFiltered.map((row) => {
                const drugLabel = displayDrug(row);
                const answered = row.answered_count ?? 0;
                const flagged = row.flagged_count ?? 0;
                const warnings = row.warning_count ?? 0;
                const questions = row.questions_count ?? 0;
                const pct =
                  questions > 0
                    ? Math.min(100, Math.round((answered / questions) * 100))
                    : 0;
                const isSelected = selectedIds.includes(row.id);
                return (
                  <div
                    key={row.id}
                    className="group relative flex flex-row items-center gap-4 rounded-xl border border-border bg-white p-4 transition-colors duration-150 hover:bg-muted/30 dark:bg-card"
                  >
                    <div
                      className="flex w-8 shrink-0 items-start justify-center pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(row.id)}
                        className={cn(
                          "h-4 w-4 cursor-pointer rounded border-border accent-primary transition-opacity",
                          "opacity-0 group-hover:opacity-100",
                          isSelected && "opacity-100",
                        )}
                        aria-label={`Select session ${row.id}`}
                      />
                    </div>

                    <div className="w-32 shrink-0">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {formatSessionDate(row.created_at)}
                      </p>
                      <p className="mt-1 font-display text-[15px] font-semibold text-foreground">
                        {row.patient_initials ?? "—"}
                      </p>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                          {displayPayer(row)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs",
                            drugPillClass(drugLabel),
                          )}
                        >
                          {drugLabel}
                        </span>
                      </div>
                      <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="max-w-[11rem] truncate text-xs text-muted-foreground sm:max-w-none">
                          {answered} answered · {flagged} flagged
                        </p>
                        {warnings > 0 ? (
                          <span className="whitespace-nowrap text-xs font-medium text-red-600 dark:text-red-400">
                            ⚠ {warnings}{" "}
                            {warnings === 1 ? "warning" : "warnings"}
                          </span>
                        ) : null}
                      </div>
                      <StatusBadge
                        sessionId={row.id}
                        status={row.status as SessionStatus | null}
                        onUpdated={load}
                      />
                      <Link
                        href={`/history/${row.id}`}
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        )}
                        aria-label="View session"
                      >
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {hasSelection ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-6">
          <div
            className="pointer-events-auto flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-background/85 px-5 py-3 shadow-lg backdrop-blur-md"
            role="toolbar"
            aria-label="Bulk actions"
          >
            <span className="font-display text-sm text-foreground">
              {selectedIds.length} selected
            </span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkStatus("approved")}
              className="font-display text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              Mark as Approved
            </button>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden>
              |
            </span>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkStatus("denied")}
              className="font-display text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              Mark as Denied
            </button>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden>
              |
            </span>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void runBulkDelete()}
              className="font-display text-sm font-medium text-destructive underline-offset-4 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
