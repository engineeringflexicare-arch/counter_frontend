"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Table2, Cpu } from "lucide-react";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";

export default function Page() {
  const params = useParams<{ lineId: string }>();
  const lineId = params?.lineId || "";
  const displayName = decodeURIComponent(lineId).replaceAll("_", " ");

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Left — breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/Supervisor"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Lines
            </Link>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-teal-50 p-1.5">
                <Cpu className="h-4 w-4 text-teal-600" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Production Log</p>
                <h1 className="text-sm font-bold text-slate-800 sm:text-base">{displayName || "Line"}</h1>
              </div>
            </div>
          </div>

          {/* Right — date picker */}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-teal-300 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Date</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none" />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Gap Analysis */}
        {lineId && (
          <div className="mb-4">
            <ProductionGapChart lineId={lineId} />
          </div>
        )}

        {/* Section card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Section header */}
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <span className="rounded-lg bg-teal-50 p-1.5 text-teal-600">
              <Table2 className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-700">Hourly Production Log</h2>
            <span className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-500">
              {new Date(selectedDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="p-5">
            {lineId ? (
              <ProductionTable lineId={lineId} date={selectedDate} />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Table2 className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">Loading line data…</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
