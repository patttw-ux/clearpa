"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Clock, FileText, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/new-pa", label: "New PA", icon: FileText },
  { href: "/history", label: "History", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Main navigation"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-all duration-150 ease-out",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-transform duration-150 ease-out",
                active && "scale-105",
              )}
              strokeWidth={active ? 2.25 : 2}
              aria-hidden
            />
            <span className="max-w-[4.5rem] truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
