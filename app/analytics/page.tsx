"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  FileText,
} from "lucide-react";

import {
  fetchAnalyticsSessions,
  type AnalyticsSessionRow,
} from "@/lib/pa-sessions";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { SessionStatus } from "@/lib/types/pa-session";
import { cn } from "@/lib/utils";

const DRUG_COLORS: Record<string, string> = {
  cequa: "#3b82f6",
  xiidra: "#8b5cf6",
  other: "#94a3b8",
};

function drugColorKey(name: string): keyof typeof DRUG_COLORS {
  const n = name.toLowerCase();
  if (n.includes("cequa")) return "cequa";
  if (n.includes("xiidra")) return "xiidra";
  return "other";
}

function groupCount(
  rows: AnalyticsSessionRow[],
  key: "payer_name" | "drug_name",
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const raw = r[key];
    const label =
      raw && String(raw).trim() !== ""
        ? String(raw).trim()
        : key === "payer_name"
          ? "Unknown payer"
          : "Other";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return map;
}

function dateKeyLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function avgAnswered(rows: AnalyticsSessionRow[]): number {
  if (rows.length === 0) return 0;
  return (
    rows.reduce((s, r) => s + (r.answered_count ?? 0), 0) / rows.length
  );
}

function avgFlaggedRate(rows: AnalyticsSessionRow[]): number {
  const rates: number[] = [];
  for (const r of rows) {
    const q = r.questions_count ?? 0;
    const f = r.flagged_count ?? 0;
    if (q > 0) rates.push((f / q) * 100);
  }
  return rates.length > 0
    ? rates.reduce((a, b) => a + b, 0) / rates.length
    : 0;
}

type WoWTrend = { show: boolean; up: boolean };

function wowTrend(current: number, previous: number, hasPrevPeriod: boolean): WoWTrend | null {
  if (!hasPrevPeriod) return null;
  if (current === previous) return null;
  return { show: true, up: current > previous };
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const mins = Math.floor(sec / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusDotClass(status: SessionStatus | null): string {
  switch (status ?? "complete") {
    case "submitted":
      return "bg-primary";
    case "approved":
      return "bg-accent";
    case "denied":
      return "bg-destructive";
    default:
      return "bg-muted-foreground";
  }
}

function computeStats(rows: AnalyticsSessionRow[]) {
  const total = rows.length;
  const sumAnswered = rows.reduce(
    (s, r) => s + (r.answered_count ?? 0),
    0,
  );
  const avgAll = total > 0 ? sumAnswered / total : 0;

  const ratesAll: number[] = [];
  for (const r of rows) {
    const q = r.questions_count ?? 0;
    const f = r.flagged_count ?? 0;
    if (q > 0) ratesAll.push((f / q) * 100);
  }
  const flaggedRateAll =
    ratesAll.length > 0
      ? ratesAll.reduce((a, b) => a + b, 0) / ratesAll.length
      : 0;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const twoWeekAgo = new Date(now);
  twoWeekAgo.setDate(twoWeekAgo.getDate() - 14);
  twoWeekAgo.setHours(0, 0, 0, 0);

  const thisWeekRows = rows.filter((r) => {
    const d = new Date(r.created_at);
    return !Number.isNaN(d.getTime()) && d >= weekAgo;
  });
  const thisWeek = thisWeekRows.length;

  const prevWeekRows = rows.filter((r) => {
    const d = new Date(r.created_at);
    return !Number.isNaN(d.getTime()) && d >= twoWeekAgo && d < weekAgo;
  });
  const prevWeekCount = prevWeekRows.length;
  const hasPrevWeek = prevWeekCount > 0;

  const trendVolume = wowTrend(thisWeek, prevWeekCount, hasPrevWeek);
  const trendAvg = wowTrend(
    avgAnswered(thisWeekRows),
    avgAnswered(prevWeekRows),
    prevWeekRows.length > 0 && thisWeekRows.length > 0,
  );
  const trendFlag = wowTrend(
    avgFlaggedRate(thisWeekRows),
    avgFlaggedRate(prevWeekRows),
    prevWeekRows.length > 0 && thisWeekRows.length > 0,
  );
  const trendThisWeek = wowTrend(thisWeek, prevWeekCount, hasPrevWeek);

  const payerMap = groupCount(rows, "payer_name");
  const payersSorted = Array.from(payerMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const topPayers = payersSorted.slice(0, 5);
  const barData = topPayers.map(([name, count]) => ({ name, count }));

  const drugMap = groupCount(rows, "drug_name");
  const drugsSorted = Array.from(drugMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const pieData = drugsSorted.map(([name, value]) => ({
    name,
    value,
    fill: DRUG_COLORS[drugColorKey(name)],
  }));
  const drugTotal = pieData.reduce((s, x) => s + x.value, 0);

  const thirtyAgo = new Date(now);
  thirtyAgo.setDate(thirtyAgo.getDate() - 29);
  thirtyAgo.setHours(0, 0, 0, 0);

  const timelineKeys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    timelineKeys.push(dateKeyLocal(d.toISOString()));
  }

  const countByDay = new Map<string, number>();
  for (const r of rows) {
    const k = dateKeyLocal(r.created_at);
    if (!k) continue;
    if (new Date(r.created_at) < thirtyAgo) continue;
    countByDay.set(k, (countByDay.get(k) ?? 0) + 1);
  }

  const timelineData = timelineKeys.map((key, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return {
      key,
      label,
      count: countByDay.get(key) ?? 0,
    };
  });

  const sessionsLast30 = rows.filter((r) => {
    const d = new Date(r.created_at);
    return !Number.isNaN(d.getTime()) && d >= thirtyAgo;
  }).length;
  const daysWithSessions = Array.from(countByDay.values()).filter(
    (c) => c > 0,
  ).length;

  const recentSessions = [...rows]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return {
    total,
    avgAnswered: avgAll,
    flaggedRate: flaggedRateAll,
    thisWeek,
    topPayers,
    barData,
    drugsSorted,
    pieData,
    drugTotal,
    timelineData,
    showTimelineSparse: sessionsLast30 < 3 || daysWithSessions < 3,
    recentSessions,
    trends: {
      total: trendVolume,
      avg: trendAvg,
      flagged: trendFlag,
      thisWeek: trendThisWeek,
    },
  };
}

function TrendLine({
  trend,
  invert,
}: {
  trend: WoWTrend | null;
  /** When true, down is good (e.g. flagged rate). */
  invert?: boolean;
}) {
  if (!trend?.show) return null;
  const good = invert ? !trend.up : trend.up;
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1 font-display text-xs font-medium",
        good ? "text-emerald-600" : "text-red-600",
      )}
    >
      {trend.up ? (
        <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      )}
      <span>vs last week</span>
    </p>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="skeleton-shimmer mb-4 h-5 w-5 rounded" />
      <div className="skeleton-shimmer mb-2 h-9 w-20 rounded" />
      <div className="skeleton-shimmer h-4 w-24 rounded" />
    </div>
  );
}

function ChartsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10">
      <div className="lg:col-span-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="skeleton-shimmer mb-4 h-5 w-24 rounded" />
          <div className="skeleton-shimmer h-[220px] w-full rounded-lg" />
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="skeleton-shimmer mb-4 h-5 w-20 rounded" />
          <div className="skeleton-shimmer h-[220px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function TimelineRowSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="skeleton-shimmer mb-4 h-5 w-40 rounded" />
        <div className="skeleton-shimmer h-[160px] w-full rounded-lg" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="skeleton-shimmer mb-4 h-5 w-24 rounded" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-shimmer h-4 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

const PRIMARY = "hsl(var(--primary))";
const PRIMARY_FILL = "hsl(var(--primary) / 0.15)";

export default function AnalyticsPage() {
  const [rows, setRows] = useState<AnalyticsSessionRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalyticsSessions();
      setRows(data);
    } catch (e) {
      setRows(null);
      setError(e instanceof Error ? e.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    if (rows === null) return null;
    return computeStats(rows);
  }, [rows]);

  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-16">
      <header className="mb-8">
        <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prior authorization performance at a glance.
        </p>
      </header>

      {!configured && (
        <div
          className="flex gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground"
          role="status"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
          <p>
            Connect Supabase in{" "}
            <code className="font-mono text-xs">.env.local</code> to see session
            analytics.
          </p>
        </div>
      )}

      {configured && error && (
        <div
          className="error-surface mb-8 flex gap-3 border border-red-200/80 px-5 py-4"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#991b1b]" />
          <div>
            <p className="font-display text-sm font-semibold text-[#991b1b]">
              Could not load data
            </p>
            <p className="mt-1 text-sm text-[#991b1b]/90">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 font-display text-sm font-medium text-[#991b1b] underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {configured && !error && loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="mt-10">
            <ChartsRowSkeleton />
          </div>
          <TimelineRowSkeleton />
        </>
      )}

      {configured && !loading && !error && rows && stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="relative overflow-hidden rounded-xl border border-border bg-card p-6 pb-7">
              <FileText
                className="h-5 w-5 text-primary"
                strokeWidth={2}
                aria-hidden
              />
              <p className="mt-4 text-[13px] text-muted-foreground">Total PAs</p>
              <p className="mt-1 font-display text-[36px] font-bold leading-none tracking-tight text-foreground">
                {stats.total}
              </p>
              <TrendLine trend={stats.trends.total} />
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"
                aria-hidden
              />
            </article>

            <article className="relative overflow-hidden rounded-xl border border-border bg-card p-6 pb-7">
              <CheckCircle2
                className="h-5 w-5 text-primary"
                strokeWidth={2}
                aria-hidden
              />
              <p className="mt-4 text-[13px] text-muted-foreground">
                Avg Answered
              </p>
              <p className="mt-1 font-display text-[36px] font-bold leading-none tracking-tight text-foreground">
                {stats.avgAnswered.toFixed(1)}
              </p>
              <TrendLine trend={stats.trends.avg} />
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent"
                aria-hidden
              />
            </article>

            <article className="relative overflow-hidden rounded-xl border border-border bg-card p-6 pb-7">
              <AlertTriangle
                className="h-5 w-5 text-primary"
                strokeWidth={2}
                aria-hidden
              />
              <p className="mt-4 text-[13px] text-muted-foreground">
                Flagged Rate
              </p>
              <p className="mt-1 font-display text-[36px] font-bold leading-none tracking-tight text-foreground">
                {`${stats.flaggedRate.toFixed(1)}%`}
              </p>
              <TrendLine trend={stats.trends.flagged} invert />
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-warning"
                aria-hidden
              />
            </article>

            <article className="relative overflow-hidden rounded-xl border border-border bg-card p-6 pb-7">
              <Calendar
                className="h-5 w-5 text-primary"
                strokeWidth={2}
                aria-hidden
              />
              <p className="mt-4 text-[13px] text-muted-foreground">This Week</p>
              <p className="mt-1 font-display text-[36px] font-bold leading-none tracking-tight text-foreground">
                {stats.thisWeek}
              </p>
              <TrendLine trend={stats.trends.thisWeek} />
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"
                aria-hidden
              />
            </article>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10">
            <section className="rounded-xl border border-border bg-card p-6 lg:col-span-3">
              <h2 className="font-display text-base font-semibold text-foreground">
                By Payer
              </h2>
              {stats.barData.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No session data yet. Save a PA from the results screen to see
                  breakdowns.
                </p>
              ) : (
                <div className="mt-4 h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.barData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        interval={0}
                        height={48}
                        tickFormatter={(v: string) =>
                          v.length > 12 ? `${v.slice(0, 11)}…` : v
                        }
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        width={32}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [
                          Number(value ?? 0),
                          "Sessions",
                        ]}
                      />
                      <Bar
                        dataKey="count"
                        fill={PRIMARY}
                        radius={[6, 6, 0, 0]}
                        isAnimationActive
                        animationDuration={600}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
              <h2 className="font-display text-base font-semibold text-foreground">
                By Drug
              </h2>
              {stats.pieData.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No session data yet.
                </p>
              ) : (
                <div className="relative mt-4 h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={stats.pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="42%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        isAnimationActive
                        animationDuration={600}
                      >
                        {stats.pieData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          Number(value ?? 0),
                          "Sessions",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs text-foreground">{value}</span>
                        )}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 flex h-[calc(100%-36px)] items-center justify-center pb-2"
                    aria-hidden
                  >
                    <span className="font-display text-2xl font-bold text-foreground">
                      {stats.drugTotal}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-base font-semibold text-foreground">
                Sessions over time
              </h2>
              {stats.showTimelineSparse ? (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  More data will appear as you process PAs
                </p>
              ) : (
                <div className="mt-4 h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.timelineData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        interval={0}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickFormatter={(_v: string, i: number) =>
                          i % 5 === 0 ? stats.timelineData[i]?.label ?? "" : ""
                        }
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        width={28}
                      />
                      <Tooltip
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload as { label?: string };
                          return p?.label ?? "";
                        }}
                        formatter={(value) => [
                          Number(value ?? 0),
                          "Sessions",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={PRIMARY}
                        strokeWidth={2}
                        fill="url(#areaFill)"
                        isAnimationActive
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-base font-semibold text-foreground">
                Recent
              </h2>
              {stats.recentSessions.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No sessions yet.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-4">
                  {stats.recentSessions.map((s) => (
                    <li key={s.id} className="flex gap-2 text-sm">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          statusDotClass(s.status),
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">
                          {s.patient_initials ?? "—"} —{" "}
                          {s.drug_name?.trim() || "—"} —{" "}
                          {s.payer_name?.trim() || "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelativeTime(s.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
