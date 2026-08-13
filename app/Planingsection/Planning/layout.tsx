"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowLeft, CalendarDays, Factory, Gauge, LayoutGrid, Sparkles, TrendingUp } from "lucide-react";

const tabs = [
  { name: "Overview", href: "/Planingsection/Planning", icon: LayoutGrid },
  { name: "Scheduler", href: "/Planingsection/Planning/scheduler", icon: CalendarDays },
  { name: "Sales Orders", href: "/Planingsection/Planning/sales-orders", icon: Factory },
  { name: "Machine Calendar", href: "/Planingsection/Planning/machine-calendar", icon: Activity },
  { name: "Tool Calendar", href: "/Planingsection/Planning/tool-calendar", icon: Gauge },
  { name: "Capacity", href: "/Planingsection/Planning/capacity", icon: LayoutGrid },
  { name: "Simulation", href: "/Planingsection/Planning/simulation", icon: Sparkles },
  { name: "KPI Dashboard", href: "/Planingsection/Planning/kpis", icon: TrendingUp },
];

export default function PlanningSubpagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-8 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/Planingsection" className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Planning module</p>
              <h2 className="text-lg font-semibold text-slate-800">Manufacturing planning workspace</h2>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${active ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  <Icon size={14} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-6">{children}</div>
    </div>
  );
}
