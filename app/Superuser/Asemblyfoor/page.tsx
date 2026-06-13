"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Factory, Target, Package, Gauge, Activity } from "lucide-react";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import LineOverviewCard from "@/app/components/LineOverviewCard";
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

interface HourlyItem {
  hour: string;
  output: number;
}

export default function AssemblyFloorPage() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // States
  const [lines, setLines] = useState<LineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState<LineData | null>(null);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [floorTotalOutput, setFloorTotalOutput] = useState(0);

  // නිවැරදි කළ නම: NEXT_PUBLIC_API_BASE_URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const FLOOR_NAME = "Assembly_Floor";

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

  // 2. Line එකක් Select කළ පසු එයට අදාළ Cumulative Chart දත්ත ලබා ගැනීම
  useEffect(() => {
    if (!selectedLine?.machineId) return;

    const fetchCumulativeData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/esp32/hourly-production/${selectedLine.machineId}?date=${selectedDate}`);

        if (res.data?.success && Array.isArray(res.data.hourlyData)) {
          let cumulative = 0;
          const chartData = res.data.hourlyData.map((item: HourlyItem) => {
            cumulative += item.output;
            return {
              time: item.hour,
              cumulative,
            };
          });
          setCumulativeChartData(chartData);
        }
      } catch (error) {
        console.error("Error fetching cumulative chart:", error);
      }
    };

    fetchCumulativeData();
    const interval = setInterval(fetchCumulativeData, 30000);
    return () => clearInterval(interval);
  }, [selectedLine, selectedDate, API_BASE_URL]);

  // 3. තෝරාගත් දිනයට සියලුම Line වල මුළු output ගණන ලබා ගැනීම
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

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-6">
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

        <div className="flex items-center gap-3 bg-white/95 p-2 px-4 rounded-lg shadow-sm">
          <label htmlFor="date" className="text-sm font-semibold text-slate-600">
            Date:
          </label>
          <input type="date" id="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-sm text-slate-800 outline-none cursor-pointer bg-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className={`rounded-xl p-3 ${stat.accent}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800">{loading ? "—" : stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : lines.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-slate-500 border border-slate-200 mb-8">No lines assigned to the Assembly Floor.</div>
      ) : (
        <div className="flex flex-wrap justify-items-start gap-4 mb-8">
          {lines.map((line) => (
            <div
              key={line.id}
              onClick={() => setSelectedLine(line)}
              className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
                selectedLine?.id === line.id ? "ring-2 ring-blue-500 rounded-xl shadow-md" : "opacity-90 hover:opacity-100"
              }`}
            >
              <LineCard line={line.id} product={line.productCode || "N/A"} machine={line.machineId || "No Machine"} target={line.dailyTarget || 0} current={line.totalProductCount || 0} />
            </div>
          ))}
        </div>
      )}

      <hr className="border-slate-200 mb-8" />

      {selectedLine ? (
        <div className="animate-fade-in-up">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-slate-800">{selectedLine.id} Detailed Overview</h2>
            <button onClick={() => setSelectedLine(null)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Close Details
            </button>
          </div>
          <div className="flex flex-col gap-6">
            <LineOverviewCard lineId={selectedLine.id} />
            <CumulativeChart machineId={selectedLine.machineId || ""} cumulativeData={cumulativeChartData} daily={selectedLine.dailyTarget || 0} />
            <ProductionGapChart lineId={selectedLine.id} date={selectedDate} />
            <ProductionTable floor={FLOOR_NAME} lineId={selectedLine.id} date={selectedDate} />
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Overall Floor Production</h2>
          <ProductionTable floor={FLOOR_NAME} date={selectedDate} />
        </div>
      )}
    </div>
  );
}
