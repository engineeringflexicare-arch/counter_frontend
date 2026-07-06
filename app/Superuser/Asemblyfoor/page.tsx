"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Factory, Target, Package, Gauge, Activity, Search } from "lucide-react";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import LineOverviewCard from "@/app/components/LineOverviewCard";
import LineCard from "@/app/components/Linecard";
import Loader from "@/app/components/Loader";

interface LineData {
  lineId: string;
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  totalProductCount?: number;
  floor?: string;
  dailyTarget?: number;
}

interface HourlyItem {
  hour: string;
  output: number;
}

const FLOOR_NAME = "Assembly_Floor";
const REFRESH_INTERVAL = 300000; // විනාඩි 5කට වරක් (5 * 60 * 1000)

export default function AssemblyFloorPage() {
  const today = new Date().toISOString().split("T")[0];

  const [inputDate, setInputDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);

  const [lines, setLines] = useState<LineData[]>([]);
  const [loading, setLoading] = useState(true); // මුල්ම පාරට පමණක් Load වීමට
  const [selectedLine, setSelectedLine] = useState<LineData | null>(null);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [floorTotalOutput, setFloorTotalOutput] = useState(0);

  // 1. Initial Load & Background Polling for Lines and Floor Total
  useEffect(() => {
    let isMounted = true;

    const fetchAllFloorData = async (isInitialLoad = false) => {
      if (isInitialLoad) setLoading(true);

      try {
        // පළමුව Lines ටික ගන්නවා
        const lineRes = await api.get("/api/lines");
        const linesData: LineData[] = lineRes.data?.data || [];
        const filteredLines = linesData.filter((line) => line.floor === FLOOR_NAME || !line.floor);

        if (isMounted) setLines(filteredLines);

        // Lines ගත්තට පස්සේ ඒ අදාළ Machines වල Total එක එකවර ගන්නවා (Promise.all)
        const machineIds = filteredLines.map((l) => l.machineId).filter((id): id is string => Boolean(id));

        if (machineIds.length > 0) {
          const totalResults = await Promise.all(
            machineIds.map(async (machineId) => {
              try {
                const res = await api.get(`/api/esp32/hourly-production/${machineId}?date=${selectedDate}`);
                return res.data?.success ? res.data.totalOutput || 0 : 0;
              } catch {
                return 0;
              }
            }),
          );
          if (isMounted) {
            setFloorTotalOutput(totalResults.reduce((sum, n) => sum + n, 0));
          }
        } else {
          if (isMounted) setFloorTotalOutput(0);
        }
      } catch (err) {
        console.error("Error fetching floor data:", err);
      } finally {
        if (isInitialLoad && isMounted) setLoading(false);
      }
    };

    fetchAllFloorData(true); // පළමු වතාවේදී Loader එක පෙන්වයි

    const interval = setInterval(() => {
      fetchAllFloorData(false); // මෙතැන් පටන් Background එකේ Fetch වෙයි (Loader එක පෙන්වන්නේ නැත)
    }, REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedDate]);

  // 2. Fetch Detailed Data for Selected Line
  useEffect(() => {
    if (!selectedLine?.machineId) return;

    const fetchCumulativeData = async () => {
      try {
        const res = await api.get(`/api/esp32/hourly-production/${selectedLine.machineId}?date=${selectedDate}`);

        if (res.data?.success && Array.isArray(res.data.hourlyData)) {
          let cumulative = 0;
          const chartData = res.data.hourlyData.map((item: HourlyItem) => {
            cumulative += item.output;
            return { time: item.hour, cumulative };
          });
          setCumulativeChartData(chartData);
        }
      } catch (error) {
        console.error("Error fetching cumulative chart:", error);
      }
    };

    fetchCumulativeData();

    // තෝරාගත් Line එකත් යාවත්කාලීන වීම (Background Refresh)
    const interval = setInterval(fetchCumulativeData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedLine, selectedDate]);

  // Derived stats
  const totalLines = lines.length;
  const activeMachines = lines.filter((l) => l.machineId).length;
  const totalProducts = floorTotalOutput;
  const totalTarget = lines.reduce((sum, l) => sum + (l.dailyTarget || 0), 0);
  const overallProgress = totalTarget > 0 ? ((totalProducts / totalTarget) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "Total Lines", value: totalLines, icon: Factory, accent: "bg-blue-50 text-blue-600" },
    { label: "Active Machines", value: activeMachines, icon: Activity, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Total Products", value: totalProducts.toLocaleString(), icon: Package, accent: "bg-indigo-50 text-indigo-600" },
    { label: "Daily Target", value: totalTarget.toLocaleString(), icon: Target, accent: "bg-amber-50 text-amber-600" },
    { label: "Overall Progress", value: `${overallProgress}%`, icon: Gauge, accent: "bg-purple-50 text-purple-600" },
  ];

  if (loading) {
    return <Loader />;
  }

  // ✅ FIX: Single root element, no extra wrapper div, no brace mismatch
  return (
    <div className="bg-neutral-50 w-full min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 rounded-2xl bg-linear-to-r from-slate-800 to-slate-700 p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-3">
            <Factory className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Assembly Floor</h1>
            <p className="text-slate-300 text-sm mt-0.5">Real-time production overview</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/95 p-2 px-3 rounded-lg shadow-sm">
          <label htmlFor="date" className="text-sm font-semibold text-slate-600">
            Date:
          </label>
          <input type="date" id="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="text-sm text-slate-800 outline-none cursor-pointer bg-transparent" />
          {/* Search Button එක */}
          <button onClick={() => setSelectedDate(inputDate)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors">
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className={`rounded-xl p-3 ${stat.accent}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Line Cards */}
      {lines.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-slate-500 border border-slate-200 mb-8">No lines assigned to the Assembly Floor.</div>
      ) : (
        <div className="flex flex-wrap gap-4 mb-8">
          {lines.map((line) => (
            <div
              key={line.lineId}
              onClick={() => setSelectedLine(line)}
              className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
                selectedLine?.lineId === line.lineId ? "ring-2 ring-blue-500 rounded-xl shadow-md" : "opacity-90 hover:opacity-100"
              }`}
            >
              <LineCard line={line.lineId} product={line.productCode || "N/A"} machine={line.machineId || "No Machine"} target={line.dailyTarget || 0} current={line.totalProductCount || 0} />
            </div>
          ))}
        </div>
      )}

      <hr className="border-slate-200 mb-8" />

      {/* Detail Panel or Floor Table */}
      {selectedLine ? (
        <div className="animate-fade-in-up">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-slate-800">{selectedLine.lineId} Detailed Overview</h2>
            <button onClick={() => setSelectedLine(null)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Close Details
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <LineOverviewCard lineId={selectedLine.lineId} />
            <CumulativeChart machineId={selectedLine.machineId || ""} cumulativeData={cumulativeChartData} daily={selectedLine.dailyTarget || 0} />
            <ProductionGapChart lineId={selectedLine.lineId} date={selectedDate} />
            <ProductionTable linesData={lines} floor={FLOOR_NAME} lineId={selectedLine.lineId} date={selectedDate} />
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Overall Floor Production</h2>
          <ProductionTable linesData={lines} floor={FLOOR_NAME} date={selectedDate} />
        </div>
      )}
    </div>
  );
}
