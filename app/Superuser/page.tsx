"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import { Factory, Layers, Activity, Package, Target, Gauge, BarChart3, PieChart as PieIcon, TrendingUp, LineChart as LineIcon, Cpu } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line as RLine } from "recharts";
import LineCard from "../components/Linecard";
import { MachineHealth } from "../components/MachineHealthBadge";
import MachineHealthBadge from "../components/MachineHealthBadge";
import Loader from "../components/Loader";

// ── Types ────────────────────────────────────────────────────────────────────

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

interface InjectionMachineData {
  id: string;
  injectionMachineNumber?: string;
  mouldNumber?: string;
  cavities?: number;
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  dailyTarget?: number;
  totalProductCount?: number;
  health?: MachineHealth;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

// Helper: parse a bucket label like "08:00-09:00" into start minute-of-day
const parseBucketStartMinutes = (label: string): number | null => {
  if (!label || !label.includes("-")) return null;
  const [startStr] = label.split("-");
  const [h, m] = startStr.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
};

export default function SuperuserDashboard() {
  const [lines, setLines] = useState<Line[]>([]);
  const [injectionMachines, setInjectionMachines] = useState<InjectionMachineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hourlyTrend, setHourlyTrend] = useState<{ hour: string; output: number; cumulative: number }[]>([]);

  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  // ── Fetch All Data (Assembly + Manufacturing) ──────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      setError("");

      // 1. Fetch Assembly Lines & Machine Health Status
      const [linesRes, healthRes, injectionRes] = await Promise.all([
        api.get(`/api/lines`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/esp32/machine-status`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/injection-machines/`).catch(() => ({ data: { data: [] } })),
      ]);

      const linesData: Line[] = linesRes.data?.data || [];
      const healthData = healthRes.data?.data || [];

      // Process Assembly Lines
      if (Array.isArray(linesData)) {
        const formattedLines: Line[] = linesData.map((line) => {
          const mStatus = healthData.find((h: MachineHealth & { liveCount?: number }) => h.machineId === line.machineId);
          return {
            ...line,
            health: mStatus,
            totalProductCount: mStatus?.liveCount ?? line.totalProductCount ?? 0,
          };
        });
        setLines(formattedLines);
      }

      // Process Injection Machines
      const rawInjData = injectionRes.data?.data;
      const injArray: InjectionMachineData[] = Array.isArray(rawInjData) ? rawInjData : rawInjData ? Object.values(rawInjData) : [];

      if (injArray.length > 0) {
        const formattedInj: InjectionMachineData[] = injArray
          .filter((val) => Boolean(val.injectionMachineNumber))
          .map((val) => {
            const mStatus = healthData.find((h: MachineHealth & { liveCount?: number }) => h.machineId === val.machineId);
            const cavity = val.cavities || 1;
            return {
              ...val,
              id: val.injectionMachineNumber as string,
              health: mStatus,
              totalProductCount: (mStatus?.liveCount || 0) * cavity,
            };
          });
        setInjectionMachines(formattedInj.sort((a, b) => a.id.localeCompare(b.id)));
      } else {
        setInjectionMachines([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load production data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // ── Combined Hourly Production Trend ───────────────────────────────────────
  useEffect(() => {
    const allDevices = [
      ...lines.filter((l) => Boolean(l.machineId)).map((l) => ({ machineId: l.machineId!, start: l.shiftStartTime || "08:30", end: l.shiftEndTime || "20:30" })),
      ...injectionMachines.filter((m) => Boolean(m.machineId)).map((m) => ({ machineId: m.machineId!, start: m.shiftStartTime || "08:30", end: m.shiftEndTime || "20:30" })),
    ];

    let isMounted = true;
    const fetchHourlyTrend = async () => {
      if (allDevices.length === 0) {
        if (isMounted) setHourlyTrend([]);
        return;
      }

      try {
        const responses = await Promise.all(
          allDevices.map(async (dev) => {
            try {
              const res = await api.get(`/api/esp32/hourly-production/${dev.machineId}?date=${today}&shiftStartTime=${encodeURIComponent(dev.start)}&shiftEndTime=${encodeURIComponent(dev.end)}`);
              return res.data?.success && Array.isArray(res.data.hourlyData) ? (res.data.hourlyData as { hour: string; output: number }[]) : [];
            } catch {
              return [];
            }
          }),
        );

        const byStartMin: Record<number, { label: string; output: number }> = {};

        responses.flat().forEach((item) => {
          const startMin = parseBucketStartMinutes(item.hour);
          if (startMin === null) return;

          if (!byStartMin[startMin]) {
            byStartMin[startMin] = { label: item.hour, output: 0 };
          }
          byStartMin[startMin].output += item.output || 0;
        });

        let cumulative = 0;
        const trend = Object.keys(byStartMin)
          .map(Number)
          .sort((a, b) => a - b)
          .map((startMin) => {
            const bucket = byStartMin[startMin];
            cumulative += bucket.output;
            return { hour: bucket.label, output: bucket.output, cumulative };
          });

        if (isMounted) setHourlyTrend(trend);
      } catch (err) {
        console.error("Error fetching hourly trend:", err);
      }
    };

    fetchHourlyTrend();
    const interval = setInterval(fetchHourlyTrend, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lines, injectionMachines, today]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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
  const totalAssemblyLines = lines.length;
  const totalInjMachines = injectionMachines.length;
  const totalUnits = totalAssemblyLines + totalInjMachines;

  const activeAssemblyMachines = lines.filter((l) => l.machineId).length;
  const activeInjMachines = injectionMachines.filter((m) => m.machineId).length;
  const activeMachinesCount = activeAssemblyMachines + activeInjMachines;

  const totalAssemblyProducts = lines.reduce((sum, l) => sum + (l.totalProductCount || 0), 0);
  const totalInjProducts = injectionMachines.reduce((sum, m) => sum + (m.totalProductCount || 0), 0);
  const totalProducts = totalAssemblyProducts + totalInjProducts;

  const totalAssemblyTarget = lines.reduce((sum, l) => sum + (l.dailyTarget || l.targetCount || 0), 0);
  const totalInjTarget = injectionMachines.reduce((sum, m) => sum + (m.dailyTarget || m.targetCount || 0), 0);
  const totalTarget = totalAssemblyTarget + totalInjTarget;

  const overallProgress = totalTarget > 0 ? ((totalProducts / totalTarget) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "Total Units/Lines", value: totalUnits, icon: Factory, accent: "bg-blue-50 text-blue-600" },
    { label: "Active Devices", value: activeMachinesCount, icon: Activity, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Total Products", value: totalProducts.toLocaleString(), icon: Package, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Total Target", value: totalTarget.toLocaleString(), icon: Target, accent: "bg-amber-50 text-amber-600" },
    { label: "Overall Progress", value: `${overallProgress}%`, icon: Gauge, accent: "bg-purple-50 text-purple-600" },
  ];

  // Assembly Floor Groups
  const floorGroups = lines.reduce<Record<string, Line[]>>((acc, line) => {
    const floor = line.floor || "Unassigned Floor";
    (acc[floor] ||= []).push(line);
    return acc;
  }, {});
  const floorNames = Object.keys(floorGroups).sort();

  // Combined Bar Chart Data (Lines + Injection Machines)
  const lineChartData = [
    ...lines.map((l) => ({
      name: l.lineId.replaceAll("_", " "),
      output: l.totalProductCount || 0,
      target: l.dailyTarget || l.targetCount || 0,
    })),
    ...injectionMachines.map((m) => ({
      name: `M/C ${m.id}`,
      output: m.totalProductCount || 0,
      target: m.dailyTarget || m.targetCount || 0,
    })),
  ];

  // Donut Chart: Products by Section/Floor
  const floorPalette = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];
  const floorPieData = [
    ...floorNames.map((floor) => ({
      name: floor.replaceAll("_", " "),
      value: floorGroups[floor].reduce((sum, l) => sum + (l.totalProductCount || 0), 0),
    })),
    {
      name: "Manufacturing (Inj)",
      value: totalInjProducts,
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <Factory className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Production Control Center</h1>
              <p className="text-slate-300 text-xs mt-0.5">Live overview across Assembly & Manufacturing Floors</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-white">Live · updates every 5s</span>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className={`rounded-xl p-3 ${stat.accent}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] lg:text-xs font-medium text-slate-500 truncate">{stat.label}</p>
                <p className="text-[12px] lg:text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        {totalUnits > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Output vs Target Bar Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Output vs Target by Unit</h2>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} cursor={{ fill: "rgba(148,163,184,0.1)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="output" name="Output" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Products by Floor / Department Donut Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <PieIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Products Breakdown</h2>
              </div>
              <div className="h-72 w-full">
                {floorPieData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={floorPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                        {floorPieData.map((entry, i) => (
                          <Cell key={`${entry.name}-${i}`} fill={floorPalette[i % floorPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hourly Trend Charts */}
        {totalUnits > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cumulative Area Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Cumulative Production · Today</h2>
              </div>
              <div className="h-72 w-full">
                {hourlyTrend.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data yet today</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <defs>
                        <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={20} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10b981" strokeWidth={2.5} fill="url(#cumFill)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Hourly Output Line Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <LineIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Hourly Output · Today</h2>
              </div>
              <div className="h-72 w-full">
                {hourlyTrend.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No production data yet today</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyTrend} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={20} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => Number(value).toLocaleString()} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <RLine type="monotone" dataKey="output" name="Output / hour" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Floor Cards Display ────────────────────────────────────────── */}

        {/* 1. Assembly Floor Sections */}
        {floorNames.map((floor) => (
          <section key={floor} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-bold text-slate-700">{floor.replaceAll("_", " ")}</h2>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{floorGroups[floor].length}</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {floorGroups[floor].map((line) => (
                <button key={line.lineId} onClick={() => router.push(`/Superuser/${line.lineId}`)} className="text-left cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none">
                  <LineCard
                    line={line.lineId}
                    product={line.productCode || "N/A"}
                    machine={line.machineId || "No Machine"}
                    target={line.targetCount || line.dailyTarget || 0}
                    current={line.totalProductCount || 0}
                    health={line.health}
                  />
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* 2. Manufacturing Floor (Injection Molding) Section */}
        {injectionMachines.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-bold text-slate-700">Manufacturing Floor (Injection Molding)</h2>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">{injectionMachines.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {injectionMachines.map((machine) => {
                const target = machine.dailyTarget || machine.targetCount || 0;
                const current = machine.totalProductCount || 0;
                const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

                return (
                  <button
                    key={machine.id}
                    onClick={() => router.push(`/Superuser/${machine.id}`)}
                    className="text-left cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none w-full"
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-base font-bold text-slate-800">Machine {machine.id}</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{pct}%</span>
                      </div>
                      <div className="mb-3">
                        <MachineHealthBadge health={machine.health} />
                      </div>
                      <div className="text-xs text-slate-500 space-y-1 mb-3">
                        <p>
                          Product: <span className="font-medium text-slate-700">{machine.productCode || "—"}</span>
                        </p>
                        <p>
                          Mould: <span className="font-medium text-slate-700">{machine.mouldNumber || "—"}</span>
                        </p>
                        <p>
                          Cavities: <span className="font-medium text-slate-700">{machine.cavities || 1}</span>
                        </p>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Output: {current.toLocaleString()}</span>
                        <span>Target: {target.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
