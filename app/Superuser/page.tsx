"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import ProductionTable from "@/app/components/ProductionTable";
import CumulativeChart, { CumulativeDataPoint } from "@/app/components/CumulativeChart";
import IntervalChart, { IntervalDataPoint } from "@/app/components/IntervalChart";
import GoalCompletionStatus from "@/app/components/GoalCompletionStatus";
import LineConfig from "@/app/components/LineConfig";
import ProductionGapChart from "@/app/components/ProductionGapChart";

// API Base URL
const API_BASE = "http://localhost:3000/api/esp32";

interface ApiLineData {
  machineId: string;
  dailyTarget: number;
  hourlyTarget: number;
  totalProductCount: number;
  productCode: string;
  floor: string;
  supervisor: string;
}

export default function LineOverviewPage() {
  const params = useParams();
  const lineId = params?.id as string;

  const [lineData, setLineData] = useState<ApiLineData | null>(null);
  const [chartData, setChartData] = useState<CumulativeDataPoint[]>([]);
  const [intervalData, setIntervalData] = useState<IntervalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lineId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Line දත්ත ලබාගැනීම
        const res = await axios.get(`${API_BASE}/lines/${lineId}`);
        const data = res.data.data;
        setLineData(data);

        // 2. අදාළ Machine එකේ දත්ත ලබාගැනීම
        if (data?.machineId) {
          const outRes = await axios.get(`${API_BASE}/total-output/${data.machineId}`);

          // චාර්ට් සඳහා දත්ත සකස් කිරීම
          const hourlyData = outRes.data.hourlyData || [];
          let current = 0;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cum = hourlyData.map((item: any) => {
            current += item.output;
            return { time: item.hour.split("-")[0], cumulative: current };
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const intv = hourlyData.map((item: any) => ({
            time: item.hour.split("-")[0],
            count: item.output,
          }));

          setChartData(cum);
          setIntervalData(intv);
        }
      } catch (e) {
        console.error("Dashboard Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [lineId]);

  if (loading) return <div className="p-10 text-center">Loading Overview for {lineId}...</div>;
  if (!lineData) return <div className="p-10 text-center">Line not found.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Overview: {lineId}</h1>
        </header>

        <GoalCompletionStatus
          liveCount={chartData[chartData.length - 1]?.cumulative || 0}
          daily={lineData.dailyTarget}
          total={lineData.totalProductCount}
          hourly={lineData.hourlyTarget}
          lineData={lineData}
          dailyPct={lineData.dailyTarget ? Math.round(((chartData[chartData.length - 1]?.cumulative || 0) / lineData.dailyTarget) * 100) : 0}
        />

        <div className="flex flex-col gap-6 mt-8">
          <CumulativeChart machineId={lineData.machineId} cumulativeData={chartData} daily={lineData.dailyTarget} />
          <IntervalChart machineId={lineData.machineId} data={intervalData} hourlyTarget={lineData.hourlyTarget} />
        </div>

        <div className="mt-8">
          <ProductionTable />
        </div>

        <div className="grid grid-cols-1 pt-6 lg:grid-cols-2 gap-6">
          <LineConfig lineData={lineData} />
        </div>

        <div className="mt-8">
          <ProductionGapChart machineId={lineData.machineId} />
        </div>
      </main>
    </div>
  );
}
