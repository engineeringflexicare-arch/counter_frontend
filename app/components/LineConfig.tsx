"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface LineData {
  productCode?: string;
  machineId?: string;
  productionStartTime?: string;
  count?: number;
  target?: number;
}

interface LineConfigProps {
  lineId: string;
}

export default function LineConfig({ lineId }: LineConfigProps) {
  const [lineData, setLineData] = useState<LineData | null>(null);

  useEffect(() => {
    const fetchLineData = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/esp32/line-live-data/${lineId}`);

        if (res.data.success) {
          setLineData({
            productCode: res.data.productCode,
            machineId: res.data.machineId,
            productionStartTime: res.data.startTime,
            count: res.data.count,
            target: res.data.target,
          });
        }
      } catch (error) {
        console.error("Error fetching line data:", error);
      }
    };

    fetchLineData();

    const interval = setInterval(fetchLineData, 3000);

    return () => clearInterval(interval);
  }, [lineId]);

  if (!lineData) {
    return <div className="rounded-2xl bg-white w-[320px] shadow-sm border border-slate-200 p-4">Loading...</div>;
  }

  const configItems = [
    {
      label: "Product Code",
      value: lineData.productCode,
      color: "#f59e0b",
    },
    {
      label: "Machine ID",
      value: lineData.machineId,
      color: "#8b5cf6",
    },
    {
      label: "Current Count",
      value: lineData.count?.toString(),
      color: "#10b981",
    },
    {
      label: "Daily Target",
      value: lineData.target?.toString(),
      color: "#0ea5e9",
    },
    {
      label: "Start Time",
      value: lineData.productionStartTime,
      color: "#f43f5e",
    },
  ];

  return (
    <div className="rounded-2xl bg-white w-[320px] shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-6 rounded-full bg-emerald-500" />

        <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Line Configuration</h2>
      </div>

      <div className="space-y-1">
        {configItems.map((item) => (
          <div key={item.label} className="flex justify-between items-center py-2 px-1 rounded-lg hover:bg-slate-50 transition-all">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">{item.label}</span>

            <span
              className="text-sm font-black"
              style={{
                color: item.color,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {item.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
