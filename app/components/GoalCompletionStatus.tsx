"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ArcProgress from "./ArcProgress";
import AnimatedNumber from "./AnimatedNumber";

interface GoalCompletionStatusProps {
  lineId: string;
}

export default function GoalCompletionStatus({ lineId }: GoalCompletionStatusProps) {
  const [data, setData] = useState({
    current: 0,
    target: 0,
    productCode: "—",
    startTime: "—",
  });

  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/esp32/line-live-data/${lineId}`);

        if (res.data.success) {
          setData({
            current: res.data.count || 0,
            target: res.data.target || 0,
            productCode: res.data.productCode || "—",
            startTime: res.data.startTime || "—",
          });
        }
      } catch (err) {
        console.error("Error fetching live data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [lineId]);

  const dailyPct = data.target > 0 ? Math.round((data.current / data.target) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto w-full rounded-2xl bg-white shadow-sm border border-slate-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-sky-500" />

          <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Goal Completion Status</h2>
        </div>

        <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Line:</span>

          <span className="text-sm font-black text-sky-600 font-mono ml-2">{lineId}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-wrap justify-center items-center gap-6">
        {/* Progress */}
        <ArcProgress value={data.current} max={data.target} label="Daily Goal" accent="DAILY" />

        {/* Live Counter */}
        <div className="flex flex-col items-center bg-slate-50 px-6 py-5 rounded-2xl border border-slate-100 min-w-55">
          <div className="text-5xl font-black tracking-tighter text-slate-900" style={{ fontFamily: "'DM Mono', monospace" }}>
            <AnimatedNumber value={data.current} />
          </div>

          <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-2">Total Produced</div>

          <div className="mt-3 flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />

            <span className="text-[10px] text-emerald-600 font-bold tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4 min-w-55">
          {[
            {
              label: "Remaining",
              value: Math.max(data.target - data.current, 0),
              color: "#6366f1",
            },
            {
              label: "Completion",
              value: `${dailyPct}%`,
              color: "#0ea5e9",
            },
            {
              label: "Product Code",
              value: data.productCode,
              color: "#f59e0b",
            },
            {
              label: "Start Time",
              value: data.startTime,
              color: "#10b981",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">{row.label}</span>

              <span
                className="text-sm font-black"
                style={{
                  color: row.color,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
