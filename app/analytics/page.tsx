import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
        <BarChart2 className="h-10 w-10" strokeWidth={1.25} aria-hidden />
      </div>
      <h1 className="mt-8 font-display text-xl font-semibold text-foreground">
        Analytics coming soon
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Volume, turnaround time, and approval rates will appear here once we
        connect your workflow data.
      </p>
    </div>
  );
}
