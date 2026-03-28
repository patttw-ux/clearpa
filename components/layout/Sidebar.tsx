"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Clock,
  FileText,
  Lock,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/new-pa", label: "New PA", icon: FileText, primary: true },
  { href: "/history", label: "History", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  primary,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md py-2.5 pl-3 pr-3 text-sm transition-all duration-150 ease-out",
        "border-l-[3px] transition-[border-color,background-color,color] duration-150 ease-out",
        active
          ? "border-primary bg-primary/5 font-medium text-foreground"
          : cn(
              "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              primary && "bg-primary/5 text-foreground hover:bg-primary/10",
            ),
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors duration-150 ease-out",
          active
            ? "text-primary"
            : primary
              ? "text-primary/90"
              : "text-muted-foreground",
        )}
      />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <aside className="hidden h-full w-[240px] shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="px-4 pt-6 pb-5">
        <Link
          href="/new-pa"
          className="flex items-center gap-2 transition-opacity duration-150 ease-out hover:opacity-90"
        >
          <ShieldCheck
            className="h-5 w-5 shrink-0 text-primary"
            strokeWidth={2}
            aria-hidden
          />
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            ClearPA
          </span>
        </Link>
        <p className="mt-2 pl-7 text-[11px] leading-snug text-muted-foreground">
          Prior auth. Simplified.
        </p>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col px-3">
        <div className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-0.5 pt-6 pb-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-md py-2.5 pl-3 pr-3 text-sm transition-all duration-150 ease-out",
              "border-l-[3px] transition-[border-color,background-color,color] duration-150 ease-out",
              settingsActive
                ? "border-primary bg-primary/5 font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Settings
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors duration-150 ease-out",
                settingsActive ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={2}
            />
            Settings
          </Link>
        </div>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <div
          className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[10px] font-medium leading-none text-muted-foreground shadow-[0_0_8px_rgba(34,197,94,0.2)] transition-shadow duration-150 ease-out"
          role="status"
        >
          <Lock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          <span>HIPAA Compliant</span>
        </div>
      </div>
    </aside>
  );
}
