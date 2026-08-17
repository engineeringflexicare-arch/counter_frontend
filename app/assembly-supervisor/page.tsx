"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import { Factory, Layers, Activity, Package, Target, Gauge, BarChart3, PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import Loader from "../components/Loader";

// ── Types ────────────────────────────────────────────────────────────────────

interface MachineHealth {
  status: "online" | "offline" | "warning";
  lastPing: Date;
  liveCount?: number;
}

interface Line {
  lineId: string;
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  totalProductCount?: number;
  dailyTarget?: number;
  floor?: string;
  health?: MachineHealth;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

// ── Custom Dashboard Card (Matching Screenshot) ──────────────────────────────

function DashboardCard({
  title,
  machine,
  product,
  target,
  current,
  health,
  onClick,
}: {
  title: string;
  machine?: string;
  product?: string;
  target: number;
  current: number;
  health?: MachineHealth;
  onClick: () => void;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  // Progress Bar Colors
  let barColor = "bg-red-500";
  if (pct >= 90) barColor = "bg-emerald-500";
  else if (pct >= 50) barColor = "bg-amber-400";

  // Status Indicator Colors
  let dotBg = "bg-slate-100";
  let dotColor = "bg-slate-400";

  if (machine) {
    if (health?.status === "online") {
      dotBg = "bg-emerald-50";
      dotColor = "bg-emerald-500";
    } else if (health?.status === "warning") {
      dotBg = "bg-amber-50";
      dotColor = "bg-amber-500";
    } else {
      // Default to red if offline or no health data but machine assigned
      dotBg = "bg-red-50";
      dotColor = "bg-red-500";
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-[20px] border border-slate-100 p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-blue-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 hover:-translate-y-1"
    >
      {/* Title & Machine Badge */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide">{machine || "No Machine"}</span>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Product</span>
          <span className="font-bold text-slate-800">{product || "N/A"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Target</span>
          <span className="font-bold text-indigo-600">{target > 0 ? target.toLocaleString() : 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-medium">Current</span>
          <span className="font-bold text-emerald-600">{current > 0 ? current.toLocaleString() : 0}</span>
        </div>
      </div>

      {/* Status Dot */}
      <div className="mb-5">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${dotBg}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs text-slate-400 font-medium">Progress</span>
        <span className="text-xs font-bold text-slate-700">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
      </div>
    </button>
  );
}

// ── Dashboard Component ──────────────────────────────────────────────────────

export default function AssemblySupervisorDashboard() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  // ── Fetch Assembly Data ────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      setError("");

      const [linesRes, healthRes] = await Promise.all([api.get(`/api/lines`).catch(() => ({ data: { data: [] } })), api.get(`/api/esp32/status`).catch(() => ({ data: { data: [] } }))]);

      const linesData: Line[] = linesRes.data?.data || [];
      const healthData = healthRes.data?.data || [];

      // Assembly Lines
      if (Array.isArray(linesData)) {
        const formattedLines: Line[] = linesData.map((line) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mStatus = healthData.find((h: any) => h.machineId === line.machineId);
          return {
            ...line,
            health: mStatus,
            totalProductCount: mStatus?.liveCount ?? line.totalProductCount ?? 0,
          };
        });
        setLines(formattedLines);
      } else {
        setLines([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load production data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (isMounted) {
        await fetchAllData();
      }
    };

    initializeData();
    const interval = setInterval(() => {
      if (isMounted) {
        fetchAllData();
      }
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchAllData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  // ── Overall Aggregated Statistics ──────────────────────────────────────────
  const totalUnits = lines.length;
  const activeMachinesCount = lines.filter((l) => l.machineId).length;
  const totalProducts = lines.reduce((sum, l) => sum + (l.totalProductCount || 0), 0);
  const totalTarget = lines.reduce((sum, l) => sum + (l.dailyTarget || l.targetCount || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProducts / totalTarget) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "Total Lines", value: totalUnits, icon: Factory, accent: "bg-blue-50 text-blue-600" },
    { label: "Active Devices", value: activeMachinesCount, icon: Activity, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Total Products", value: totalProducts.toLocaleString(), icon: Package, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Total Target", value: totalTarget.toLocaleString(), icon: Target, accent: "bg-amber-50 text-amber-600" },
    { label: "Overall Progress", value: `${overallProgress}%`, icon: Gauge, accent: "bg-purple-50 text-purple-600" },
  ];

  // ── Floor Grouping Logic ───────────────────────────────────────────────────
  const floorGroups = lines.reduce<Record<string, Line[]>>((acc, line) => {
    // Floor එකක් නැත්නම් "Unassigned Floor" ලෙස කාණ්ඩ කරන්න
    const floor = line.floor?.trim() ? line.floor : "Unassigned Floor";
    (acc[floor] ||= []).push(line);
    return acc;
  }, {});

  // Sort: "Assembly Floor" මුලින්ම පෙන්වීමට, "Unassigned Floor" අගට පෙන්වීමට
  const floorNames = Object.keys(floorGroups).sort((a, b) => {
    if (a === "Assembly Floor") return -1;
    if (b === "Assembly Floor") return 1;
    if (a === "Unassigned Floor") return 1;
    if (b === "Unassigned Floor") return -1;
    return a.localeCompare(b);
  });

  // Bar Chart Data
  const lineChartData = lines.map((l) => ({
    name: l.lineId.replaceAll("_", " "),
    output: l.totalProductCount || 0,
    target: l.dailyTarget || l.targetCount || 0,
  }));

  // Donut Chart Data
  const floorPalette = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];
  const floorPieData = floorNames
    .map((floor) => ({
      name: floor.replaceAll("_", " "),
      value: floorGroups[floor].reduce((sum, l) => sum + (l.totalProductCount || 0), 0),
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-350 mx-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition hover:shadow-md">
              <div className={`rounded-xl p-3 ${stat.accent}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        {totalUnits > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Output vs Target Bar Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-8">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-700">Output vs Target by Line</h2>
              </div>
              <div className="h-75 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineChartData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 12 }} cursor={{ fill: "rgba(241,245,249,0.5)" }} />
                    <Legend wrapperStyle={{ fontSize: 12, bottom: -10 }} iconType="circle" />
                    <Bar dataKey="output" name="Output" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Products Breakdown Donut Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 mb-8">
                <PieIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-700">Products Breakdown</h2>
              </div>
              <div className="h-75 w-full">
                {floorPieData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={floorPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                        {floorPieData.map((entry, i) => (
                          <Cell key={`${entry.name}-${i}`} fill={floorPalette[i % floorPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Floor Cards Display ─────────────────────────────────────────── */}
        {floorNames.map((floor) => (
          <section key={floor} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Layers className="h-6 w-6 text-slate-400" />
              <h2 className="text-xl font-extrabold text-slate-700 tracking-tight">{floor.replaceAll("_", " ")}</h2>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{floorGroups[floor].length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {floorGroups[floor]
                .sort((a, b) => a.lineId.localeCompare(b.lineId))
                .map((line) => (
                  <DashboardCard
                    key={line.lineId}
                    title={line.lineId}
                    machine={line.machineId}
                    product={line.productCode}
                    target={line.dailyTarget || line.targetCount || 0}
                    current={line.totalProductCount || 0}
                    health={line.health}
                    // ✅ පහත Route එක ඔබගේ Assembly Supervisor Folder එකට අදාළව අවශ්‍ය නම් වෙනස් කරගන්න.
                    onClick={() => router.push(`/assembly-supervisor/${line.lineId}`)}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
