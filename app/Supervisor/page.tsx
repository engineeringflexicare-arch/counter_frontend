"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import { Activity, Cpu, Package, TrendingUp, RefreshCw, ChevronRight, AlertCircle } from "lucide-react";
import MachineHealthBadge, { MachineHealth } from "../components/MachineHealthBadge";

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiLineData {
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  dailyTarget?: number;
  hourlyTarget?: number;
  totalProductCount?: number;
  shift?: string;
  supervisor?: string;
  plannedMembers?: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

interface LineData extends ApiLineData {
  id: string;
  health?: MachineHealth;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function progressPct(current: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function statusColor(pct: number) {
  if (pct >= 90) return { bar: "bg-teal-500", badge: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" };
  if (pct >= 60) return { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" };
  return { bar: "bg-red-400", badge: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-400" };
}

function statusLabel(pct: number) {
  if (pct >= 90) return "On Track";
  if (pct >= 60) return "Behind";
  return "At Risk";
}

// ── Line Card ─────────────────────────────────────────────────────────────────

function LineCard({ line, onClick }: { line: LineData; onClick: () => void }) {
  const target = line.dailyTarget || line.targetCount || 0;
  const current = line.totalProductCount || 0;
  const pct = progressPct(current, target);
  const colors = statusColor(pct);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150 hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
            <Activity className="h-4.5 w-4.5 text-teal-600" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Line</p>
            <p className="font-mono text-base font-bold leading-tight text-slate-800">{line.id}</p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colors.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
          {statusLabel(pct)}
        </span>
      </div>

      {/* Metadata row */}
      <div className="mb-4 flex flex-wrap gap-3">
        <MetaChip icon={<Cpu className="h-3 w-3" />} label={line.machineId || "No machine"} />
        <MetaChip icon={<Package className="h-3 w-3" />} label={line.productCode || "—"} />
        {line.shift && (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
              line.shift === "Day" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-indigo-200 bg-indigo-50 text-indigo-700"
            }`}
          >
            {line.shift} Shift
          </span>
        )}
      </div>

      <div className="mb-4">
        <MachineHealthBadge health={line.health} />
      </div>

      {/* Progress */}
      <div className="mb-1 flex items-end justify-between">
        <p className="text-[11px] font-medium text-slate-400">Daily Progress</p>
        <p className="font-mono text-xs font-bold text-slate-700">
          {current.toLocaleString()}
          <span className="font-normal text-slate-400"> / {target.toLocaleString()}</span>
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all duration-500 ${colors.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">{pct}% complete</p>
        <span className="flex items-center gap-0.5 text-[11px] font-medium text-teal-600 opacity-0 transition group-hover:opacity-100">
          View details <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600">
      <span className="text-slate-400">{icon}</span>
      {label}
    </span>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ lines }: { lines: LineData[] }) {
  const total = lines.length;
  const onTrack = lines.filter((l) => {
    const t = l.dailyTarget || l.targetCount || 0;
    return progressPct(l.totalProductCount || 0, t) >= 90;
  }).length;
  const atRisk = lines.filter((l) => {
    const t = l.dailyTarget || l.targetCount || 0;
    return progressPct(l.totalProductCount || 0, t) < 60;
  }).length;
  const totalOutput = lines.reduce((s, l) => s + (l.totalProductCount || 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
      {[
        { label: "Active Lines", value: total, icon: <Activity className="h-4 w-4 text-teal-600" />, bg: "bg-teal-50" },
        { label: "On Track", value: onTrack, icon: <TrendingUp className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50" },
        { label: "At Risk", value: atRisk, icon: <AlertCircle className="h-4 w-4 text-red-500" />, bg: "bg-red-50" },
        { label: "Total Output", value: totalOutput.toLocaleString(), icon: <Package className="h-4 w-4 text-indigo-600" />, bg: "bg-indigo-50" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded-lg p-1.5 ${s.bg}`}>{s.icon}</span>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
          </div>
          <p className="font-mono text-2xl font-bold text-slate-800">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function SupervisorDashboard() {
  const [lines, setLines] = useState<LineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<"all" | "on-track" | "behind" | "at-risk">("all");
  const router = useRouter();

  // ✅ Corrected API calls using consistent backend routes
  const fetchLines = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // Use /api/lines/ instead of /api/esp32/lines
      const linesRes = await api.get(`/api/lines/`);
      // Use /api/esp32/status instead of /api/esp32/machine-status
      const healthRes = await api.get(`/api/esp32/status`);

      const data = linesRes.data?.data as Record<string, ApiLineData>;
      const healthData = healthRes.data?.data || [];

      if (data) {
        const arr: LineData[] = Object.entries(data).map(([key, val]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mHealth = healthData.find((h: any) => h.machineId === val.machineId);
          return {
            ...val,
            id: key,
            health: mHealth,
          };
        });
        setLines(arr.sort((a, b) => a.id.localeCompare(b.id)));
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching lines:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchLinesRef = useRef(fetchLines);
  useEffect(() => {
    fetchLinesRef.current = fetchLines;
  }, [fetchLines]);

  useEffect(() => {
    const initialTimer = setTimeout(() => fetchLinesRef.current(), 0);
    const iv = setInterval(() => fetchLinesRef.current(), 30000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(iv);
    };
  }, []);

  const filteredLines = lines.filter((l) => {
    const t = l.dailyTarget || l.targetCount || 0;
    const pct = progressPct(l.totalProductCount || 0, t);
    if (filter === "on-track") return pct >= 90;
    if (filter === "behind") return pct >= 60 && pct < 90;
    if (filter === "at-risk") return pct < 60;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Supervisor View</p>
            <h1 className="text-base font-bold text-slate-800 sm:text-lg">Production Lines</h1>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && <p className="hidden text-[11px] text-slate-400 sm:block">Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
            <button
              onClick={() => fetchLines(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-500" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <SummaryBar lines={lines} />

        <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {(["all", "on-track", "behind", "at-risk"] as const).map((f) => {
            const labels: Record<typeof f, string> = {
              all: `All (${lines.length})`,
              "on-track": "On Track",
              behind: "Behind",
              "at-risk": "At Risk",
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  filter === f ? "bg-teal-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {filteredLines.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <span className="rounded-full bg-slate-100 p-4">
              <Activity className="h-6 w-6 text-slate-400" />
            </span>
            <p className="text-sm font-semibold text-slate-500">No lines in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLines.map((line) => (
              <LineCard key={line.id} line={line} onClick={() => router.push(`/Supervisor/line/${line.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
