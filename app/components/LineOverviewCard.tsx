"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ArcProgress from "./ArcProgress";

interface Props {
  lineId: string;
  date?: string; // 👈 අලුතින් එකතු කළා
}

interface DashboardData {
  current: number;
  target: number;
  productCode: string;
  machineId: string;
  startTime: string;
  endTime: string;
}

export default function LineOverviewCard({ lineId, date }: Props) {
  const [data, setData] = useState<DashboardData>({
    current: 0,
    target: 0,
    productCode: "—",
    machineId: "—",
    startTime: "—",
    endTime: "—",
  });

  useEffect(() => {
    let isMounted = true;
    // FIX: declare interval up-front (not just inside the `if`) so the
    // cleanup function always has a stable reference to clear, even if
    // `isToday` is false and the interval is never created.
    let interval: ReturnType<typeof setInterval> | undefined;

    const fetchData = async () => {
      if (!lineId) return;
      try {
        const res = await api.get(`/api/esp32/line-live-data/${lineId}`);

        if (res.data.success && isMounted) {
          setData({
            current: res.data.count || 0,
            target: res.data.target || 0,
            productCode: res.data.productCode || "—",
            machineId: res.data.machineId || "—",
            startTime: res.data.startTime || "—",
            // NOTE: this will keep showing "—" until the backend's
            // getLiveDataByLineId actually returns an `endTime` field
            // (it currently only returns `startTime`, not `endTime`).
            // Once the backend sends `endTime: lineData.shiftEndTime`,
            // this line needs no further changes.
            endTime: res.data.endTime || "—",
          });
        }
      } catch (error) {
        console.error("Line Overview Error:", error);
      }
    };

    fetchData();

    // 💡 දත්ත පරණ දවසක එකක් නම්, auto-refresh අවශ්‍ය නැත.
    // අද දවස නම් පමණක් refresh කරන්න.
    const isToday = !date || date === new Date().toISOString().split("T")[0];
    if (isToday) {
      interval = setInterval(fetchData, 3000);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [lineId, date]); // 👈 Dependency array එකට date එක එකතු කළා

  const percentage = data.target > 0 ? ((data.current / data.target) * 100).toFixed(1) : "0";

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
            <span className="text-xs text-slate-500">Shift Start Time</span>
            <span className="font-bold text-rose-500">{data.startTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Shift End Time</span>
            <span className="font-bold text-indigo-600">{data.endTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
