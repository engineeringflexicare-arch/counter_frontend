"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
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

export default function LinePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const lineId = resolvedParams.id;

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [machineId, setMachineId] = useState("Machine_01");
  const [dailyTarget, setDailyTarget] = useState(4300);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);

  // නිවැරදි කළ නම: NEXT_PUBLIC_API_BASE_URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Line details ලබා ගැනීම
        const lineRes = await axios.get(`${API_BASE_URL}/api/esp32/lines/${lineId}`);

        let currentMachineId = "Machine_01";
        if (lineRes.data?.success) {
          currentMachineId = lineRes.data.data?.machineId || "Machine_01";
          setMachineId(currentMachineId);
          setDailyTarget(lineRes.data.data?.dailyTarget || 4300);
        }

        // 2. තෝරාගත් දිනයට (selectedDate) අදාළව Hourly Production Data ලබා ගැනීම
        const res = await axios.get(`${API_BASE_URL}/api/esp32/hourly-production/${currentMachineId}?date=${selectedDate}`);

        if (res.data?.success && Array.isArray(res.data.hourlyData)) {
          let cumulative = 0;
          const chartData = res.data.hourlyData.map((item: HourlyItem) => {
            cumulative += item.output;
            return { time: item.hour, cumulative };
          });
          setCumulativeChartData(chartData);
        }
      } catch (error) {
        console.error("Error fetching line data:", error);
      }
    };

    fetchData();
  }, [lineId, selectedDate, API_BASE_URL]);

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-extrabold text-slate-800">{lineId.replaceAll("_", " ")} Overview</h1>

        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-lg shadow-sm border border-slate-200">
          <label htmlFor="line-date" className="text-sm font-semibold text-slate-600">
            Select Date:
          </label>
          <input type="date" id="line-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-sm text-slate-800 outline-none cursor-pointer bg-transparent" />
        </div>
      </div>

      {/* Top Section */}
      <div className="flex gap-4 items-start mb-4">
        <div className="flex-1">
          <LineOverviewCard lineId={lineId} />
        </div>
      </div>

      {/* Cumulative Chart */}
      <div className="mb-4">
        <CumulativeChart machineId={machineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
      </div>

      {/* Gap Analysis */}
      <div className="mb-4">
        <ProductionGapChart lineId={lineId} date={selectedDate} />
      </div>

      {/* Production Table */}
      <ProductionTable lineId={lineId} date={selectedDate} />
    </div>
  );
}
