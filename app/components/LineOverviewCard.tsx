"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ArcProgress from "./ArcProgress";

interface Props {
  lineId: string;
}

interface DashboardData {
  current: number;
  target: number;
  productCode: string;
  machineId: string;
  startTime: string;
}

export default function LineOverviewCard({ lineId }: Props) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const [data, setData] = useState<DashboardData>({
    current: 0,
    target: 0,
    productCode: "—",
    machineId: "—",
    startTime: "—",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/esp32/line-live-data/${lineId}`);

        if (res.data.success) {
          setData({
            current: res.data.count || 0,
            target: res.data.target || 0,
            productCode: res.data.productCode || "—",
            machineId: res.data.machineId || "—",
            startTime: res.data.startTime || "—",
          });
        }
      } catch (error) {
        console.error("Line Overview Error:", error);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [API_BASE_URL, lineId]);

  const percentage = data.target > 0 ? ((data.current / data.target) * 100).toFixed(1) : "0";

  const remaining = Math.max(data.target - data.current, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-3">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <ArcProgress value={data.current} max={data.target} label="" accent="DAILY" />

          <div>
            <p className="text-xl font-black text-emerald-600">{percentage}%</p>

            <p className="text-[10px] uppercase tracking-wider text-slate-400">Completion</p>
          </div>
        </div>

        {/* Machine + Product */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Machine</span>

            <span className="font-bold text-sky-600">{data.machineId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Product</span>

            <span className="font-bold text-orange-500">{data.productCode}</span>
          </div>
        </div>

        {/* Current + Target */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Current</span>

            <span className="font-bold text-green-600">{data.current}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Target</span>

            <span className="font-bold text-blue-600">{data.target}</span>
          </div>
        </div>

        {/* Remaining + Start */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Remaining</span>

            <span className="font-bold text-indigo-600">{remaining}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Start</span>

            <span className="font-bold text-rose-500">{data.startTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
