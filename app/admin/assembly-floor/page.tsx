"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Factory, Target, Package, Gauge, Activity, Radio, ChevronRight } from "lucide-react";
import ProductionTable from "@/app/components/ProductionTable";
import LineCard from "@/app/components/Linecard";

// දත්ත වල හැඩය (Interface)
interface LineData {
  id: string;
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  totalProductCount?: number;
  floor?: string;
  dailyTarget?: number;
}

export default function ADminAssemblyFloorViewPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // States
  const [lines, setLines] = useState<LineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [floorTotalOutput, setFloorTotalOutput] = useState(0);

  // නිවැරදි කළ නම: NEXT_PUBLIC_API_BASE_URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const FLOOR_NAME = "Assembly Floor";

  interface LineApiResponse {
    [key: string]: LineData;
  }

  // 1. Assembly Floor එකට අදාළ Lines ලබා ගැනීම
  useEffect(() => {
    const fetchLines = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/esp32/lines`);

        const data = res.data?.data as LineApiResponse;

        if (data) {
          const linesArray: LineData[] = Object.entries(data)
            .map(([key, value]) => ({
              ...value,
              id: key,
            }))
            .filter((line) => line.floor === FLOOR_NAME || !line.floor);

          setLines(linesArray);
        }
      } catch (err) {
        console.error("Error fetching lines:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLines();
    const interval = setInterval(fetchLines, 30000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  // 2. තෝරාගත් දිනයට සියලුම Line වල මුළු output ගණන ලබා ගැනීම
  useEffect(() => {
    const machineIds = lines.map((l) => l.machineId).filter((id): id is string => Boolean(id));

    let isMounted = true;
    const fetchFloorTotal = async () => {
      if (machineIds.length === 0) {
        if (isMounted) setFloorTotalOutput(0);
        return;
      }
      try {
        const results = await Promise.all(
          machineIds.map(async (machineId) => {
            try {
              const res = await axios.get(`${API_BASE_URL}/api/esp32/hourly-production/${machineId}?date=${selectedDate}`);
              return res.data?.success ? res.data.totalOutput || 0 : 0;
            } catch {
              return 0;
            }
          }),
        );
        if (isMounted) setFloorTotalOutput(results.reduce((sum, n) => sum + n, 0));
      } catch (error) {
        console.error("Error fetching floor total:", error);
      }
    };

    fetchFloorTotal();
    const interval = setInterval(fetchFloorTotal, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lines, selectedDate, API_BASE_URL]);

  // Line card එක click කළ විට, ඒ line එකේ overview page එකට navigate කරයි
  // -> /assemblyfloor/[id]/page.tsx
  const handleLineClick = (line: LineData) => {
    router.push(`/Admin/assembly-floor/${line.id}`);
  };

  const activeLines = lines.filter((l) => l.machineId);
  const idleLines = lines.filter((l) => !l.machineId);

  const totalLines = lines.length;
  const activeMachines = activeLines.length;
  const totalProducts = floorTotalOutput;
  const totalTarget = lines.reduce((sum, l) => sum + (l.dailyTarget || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProducts / totalTarget) * 100).toFixed(1) : "0.0";
  const progressNum = parseFloat(overallProgress);

  const stats = [
    { label: "Total Lines", value: totalLines, icon: Factory, accent: "text-sky-400", glow: "shadow-sky-500/10" },
    { label: "Active Machines", value: activeMachines, icon: Activity, accent: "text-emerald-400", glow: "shadow-emerald-500/10" },
    { label: "Total Output", value: totalProducts.toLocaleString(), icon: Package, accent: "text-violet-400", glow: "shadow-violet-500/10" },
    { label: "Daily Target", value: totalTarget.toLocaleString(), icon: Target, accent: "text-amber-400", glow: "shadow-amber-500/10" },
    { label: "Overall Progress", value: `${overallProgress}%`, icon: Gauge, accent: "text-cyan-400", glow: "shadow-cyan-500/10" },
  ];

  return (
    <div
      className="min-h-screen w-full bg-[#0A0E14] p-4 text-slate-200 sm:p-6"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.07) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* ===== Control header ===== */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0F1420] p-6 shadow-xl shadow-black/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative rounded-xl border border-slate-700 bg-slate-900 p-3">
            <Factory className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold uppercase tracking-wider text-white sm:text-2xl">Assembly Floor</h1>
              <span className="hidden rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-slate-400 sm:inline">ADMIN</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              </span>
              Live production monitor &middot; refreshes every 30s
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2.5">
          <label htmlFor="date" className="font-mono text-xs uppercase tracking-wide text-slate-500">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="cursor-pointer bg-transparent font-mono text-sm text-slate-100 outline-none scheme-dark"
          />
        </div>
      </div>

      {/* ===== KPI strip ===== */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className={`group relative overflow-hidden rounded-xl border border-slate-800 bg-[#0F1420] p-4 shadow-lg ${stat.glow} transition-colors hover:border-slate-700`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.accent} opacity-80`} />
            </div>
            <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums text-white`}>{loading ? <span className="text-slate-600">—</span> : stat.value}</p>
          </div>
        ))}
      </div>

      {/* progress rail */}
      {!loading && totalTarget > 0 && (
        <div className="-mt-5 mb-8 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressNum >= 100 ? "bg-emerald-400" : progressNum >= 60 ? "bg-cyan-400" : "bg-amber-400"}`}
            style={{ width: `${Math.min(progressNum, 100)}%` }}
          />
        </div>
      )}

      {/* ===== Line tiles ===== */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400"></div>
        </div>
      ) : lines.length === 0 ? (
        <div className="mb-8 rounded-xl border border-dashed border-slate-800 bg-[#0F1420] p-8 text-center text-sm text-slate-500">No lines assigned to the Assembly Floor.</div>
      ) : (
        <>
          {/* Active lines — shown up front */}
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-300">Active Lines</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">{activeLines.length}</span>
          </div>

          {activeLines.length === 0 ? (
            <div className="mb-8 rounded-xl border border-dashed border-slate-800 bg-[#0F1420] p-6 text-center text-sm text-slate-500">No active lines on this floor right now.</div>
          ) : (
            <div className="mb-8 flex flex-wrap gap-4">
              {activeLines.map((line) => (
                <div key={line.id} onClick={() => handleLineClick(line)} className="group relative cursor-pointer rounded-xl transition-all duration-200 hover:-translate-y-1">
                  <LineCard line={line.id} product={line.productCode || "N/A"} machine={line.machineId || "No Machine"} target={line.dailyTarget || 0} current={line.totalProductCount || 0} />
                  <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/90 px-2 py-1 font-mono text-[10px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Overview <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Idle / unassigned lines — secondary, tucked below */}
          {idleLines.length > 0 && (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-slate-600" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">Idle / Unassigned Lines</h2>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-500">{idleLines.length}</span>
              </div>
              <div className="mb-8 flex flex-wrap gap-4 opacity-70">
                {idleLines.map((line) => (
                  <div key={line.id} onClick={() => handleLineClick(line)} className="relative cursor-pointer rounded-xl grayscale transition-all duration-200 hover:-translate-y-1 hover:grayscale-0">
                    <LineCard line={line.id} product={line.productCode || "N/A"} machine={line.machineId || "No Machine"} target={line.dailyTarget || 0} current={line.totalProductCount || 0} />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="mb-8 h-px w-full bg-linear-to-r from-transparent via-slate-800 to-transparent" />

      {/* ===== Floor summary table ===== */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">Floor Summary</p>
        <h2 className="mb-4 font-mono text-lg font-bold text-white">Overall Floor Production</h2>
        <ProductionTable floor={FLOOR_NAME} date={selectedDate} />
      </div>
    </div>
  );
}
