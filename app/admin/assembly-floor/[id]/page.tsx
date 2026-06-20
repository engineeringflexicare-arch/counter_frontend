"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Gauge, User, Clock, Layers, AlertCircle } from "lucide-react";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import LineOverviewCard from "@/app/components/LineOverviewCard";

interface PageProps {
  params: Promise<{
    id: string; // ඔයාගේ ෆෝල්ඩර් නම [id] නිසා මෙහි id ලෙස තිබිය යුතුය
  }>;
}

interface HourlyItem {
  hour: string;
  output: number;
}

// API එකෙන් එන Line record එකේ සම්පූර්ණ හැඩය
interface LineRecord {
  lineId: string;
  machineId?: string;
  productCode?: string;
  dailyTarget?: number;
  hourlyTarget?: number;
  plannedMembers?: number;
  totalProductCount?: number;
  shift?: string;
  floor?: string;
  supervisor?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

export default function LinePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const lineId = resolvedParams.id;

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Hardcoded defaults ඉවත් කරලා — line record එක load වෙනකම් null
  const [lineData, setLineData] = useState<LineRecord | null>(null);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // 1. Line record එක ලබා ගැනීම — සියලුම fields dynamic ලෙස state එකට
  useEffect(() => {
    let isMounted = true;

    const fetchLine = async () => {
      try {
        setLoading(true);
        setError(null);

        const lineRes = await axios.get(`${API_BASE_URL}/api/esp32/lines/${lineId}`);

        if (lineRes.data?.success && lineRes.data?.data) {
          if (isMounted) setLineData(lineRes.data.data as LineRecord);
        } else {
          if (isMounted) setError("Line data not found.");
        }
      } catch (err) {
        console.error("Error fetching line data:", err);
        if (isMounted) setError("Failed to load line data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLine();
    const interval = setInterval(fetchLine, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lineId, API_BASE_URL]);

  // 2. machineId ලැබුණු පසු, ඒකට අදාළ Hourly Production දත්ත ලබා ගැනීම
  useEffect(() => {
    const machineId = lineData?.machineId;
    let isMounted = true;

    const fetchCumulative = async () => {
      if (!machineId) {
        if (isMounted) setCumulativeChartData([]);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/esp32/hourly-production/${machineId}?date=${selectedDate}`);

        if (res.data?.success && Array.isArray(res.data.hourlyData)) {
          let cumulative = 0;
          const chartData = res.data.hourlyData.map((item: HourlyItem) => {
            cumulative += item.output;
            return { time: item.hour, cumulative };
          });
          if (isMounted) setCumulativeChartData(chartData);
        }
      } catch (err) {
        console.error("Error fetching cumulative data:", err);
      }
    };

    fetchCumulative();
    const interval = setInterval(fetchCumulative, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lineData?.machineId, selectedDate, API_BASE_URL]);

  const hasMachine = Boolean(lineData?.machineId);

  const infoChips = lineData
    ? [
        { icon: Layers, label: "Product", value: lineData.productCode || "—" },
        { icon: User, label: "Supervisor", value: lineData.supervisor || "—" },
        { icon: Clock, label: "Shift", value: lineData.shift ? `${lineData.shift} (${lineData.shiftStartTime || "—"} - ${lineData.shiftEndTime || "—"})` : "—" },
      ]
    : [];

  return (
    <div
      className="min-h-screen w-full bg-[#0A0E14] p-4 text-slate-200 sm:p-6"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.07) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* ===== Header ===== */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0F1420] p-6 shadow-xl shadow-black/30 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push("/Admin/assembly-floor")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Floor
          </button>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <Gauge className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">{lineData?.floor || "Line Detail"}</p>
            <h1 className="font-mono text-xl font-bold uppercase tracking-wider text-white sm:text-2xl">{lineId.replaceAll("_", " ")}</h1>

            {!loading && lineData && (
              <div className="mt-2 flex flex-wrap gap-2">
                {infoChips.map((chip) => (
                  <span key={chip.label} className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 font-mono text-[11px] text-slate-400">
                    <chip.icon className="h-3 w-3 text-slate-500" />
                    {chip.value}
                  </span>
                ))}
                {!hasMachine && (
                  <span className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    No machine assigned
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2.5">
          <label htmlFor="line-date" className="font-mono text-xs uppercase tracking-wide text-slate-500">
            Date
          </label>
          <input
            type="date"
            id="line-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="cursor-pointer bg-transparent font-mono text-sm text-slate-100 outline-none scheme-dark"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-red-900/50 bg-[#0F1420] p-8 text-center text-sm text-red-400">{error}</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Overview */}
          <LineOverviewCard lineId={lineId} />

          {/* Cumulative Chart — machine නැත්නම් data empty */}
          <CumulativeChart machineId={lineData?.machineId || ""} cumulativeData={cumulativeChartData} daily={lineData?.dailyTarget || 0} />

          {/* Gap Analysis */}
          <ProductionGapChart lineId={lineId} date={selectedDate} />

          {/* Production Table */}
          <ProductionTable lineId={lineId} date={selectedDate} />
        </div>
      )}
    </div>
  );
}
