"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ArcProgress from "./ArcProgress";

interface Props {
  machineNumber: string; // e.g. INJ_01
  date?: string;
}

interface MachineOverviewData {
  current: number;
  target: number;
  productCode: string;
  machineId: string;
  startTime: string;
  endTime: string;
}

interface EspStatus {
  machineId: string;
  liveCount?: number;
}

export default function InjectionMachineOverviewCard({ machineNumber, date }: Props) {
  const [data, setData] = useState<MachineOverviewData>({
    current: 0,
    target: 0,
    productCode: "—",
    machineId: "—",
    startTime: "—",
    endTime: "—",
  });

  useEffect(() => {
    let isMounted = true;
    let interval: ReturnType<typeof setInterval> | undefined;

    const fetchData = async () => {
      if (!machineNumber) return;
      try {
        // 1. MongoDB එකෙන් Injection Machine එකේ විස්තර ලබාගැනීම
        const res = await api.get(`/api/injection-machines/${machineNumber}`);

        if (res.data.success && isMounted) {
          const machine = res.data.data || {};
          const espId = machine.machineId;

          let liveCount = machine.totalProductCount || 0;

          // 2. Firebase එකෙන් සජීවී කවුන්ට් එක (Live Count) ලබාගැනීම සඳහා status API එකට කෝල් කිරීම
          if (espId) {
            try {
              const statusRes = await api.get<{ success: boolean; data: EspStatus[] }>(`/api/esp32/status`);
              if (statusRes.data?.success && Array.isArray(statusRes.data.data)) {
                const matchedEsp = statusRes.data.data.find((item: EspStatus) => item.machineId === espId);
                if (matchedEsp && typeof matchedEsp.liveCount === "number") {
                  liveCount = matchedEsp.liveCount;
                }
              }
            } catch (statusErr) {
              console.error("Error fetching ESP status live count:", statusErr);
            }
          }

          setData({
            current: liveCount,
            target: machine.dailyTarget || 0,
            productCode: machine.productCode || "—",
            machineId: espId || "—",
            startTime: machine.shiftStartTime || "—",
            endTime: machine.shiftEndTime || "—",
          });
        }
      } catch (error) {
        console.error("Injection Machine Overview Error:", error);
      }
    };

    fetchData();

    // අද දවස නම් පමණක් සෑම තත්පර 3කට වරක් auto-refresh කරන්න
    const isToday = !date || date === new Date().toISOString().split("T")[0];
    if (isToday) {
      interval = setInterval(fetchData, 3000);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [machineNumber, date]);

  const percentage = data.target > 0 ? Math.min(100, Number(((data.current / data.target) * 100).toFixed(1))) : 0;

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

        {/* ESP32 Machine + Product */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">ESP32 Device</span>
            <span className="font-bold text-sky-600">{data.machineId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Product Code</span>
            <span className="font-bold text-orange-500">{data.productCode}</span>
          </div>
        </div>

        {/* Current + Target */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Current Output</span>
            <span className="font-bold text-green-600">{data.current.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Daily Target</span>
            <span className="font-bold text-blue-600">{data.target.toLocaleString()}</span>
          </div>
        </div>

        {/* Shift Start + End */}
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
