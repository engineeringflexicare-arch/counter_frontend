"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ label, value, sub, icon: Icon, accent, border }: { label: string; value: string | number; sub?: string; icon: LucideIcon; accent: string; border: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 ${border} px-5 py-4 flex items-center justify-between`}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon size={18} className={accent} />
      </div>
    </div>
  );
}

export function SectionCard({ title, subtitle, actionLabel, actionHref, children }: { title: string; subtitle?: string; actionLabel?: string; actionHref?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            {actionLabel} <ArrowRight size={12} />
          </Link>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "blue" | "green" | "amber" | "red" | "slate" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    slate: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}>{label}</span>;
}
