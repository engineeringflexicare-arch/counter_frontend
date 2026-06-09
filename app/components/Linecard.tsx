"use client";

import axios from "axios";
import { useEffect, useState } from "react";

interface LineCardProps {
  line: string;
  product: string;
  machine: string;
  target: number;
  current: number;
}

export default function LineCard({ line, product, machine, target: propTarget, current: propCurrent }: LineCardProps) {
  const [target, setTarget] = useState(propTarget);
  const [current, setCurrent] = useState(propCurrent);

  useEffect(() => {
    const fetchLiveMetrics = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/esp32/metrics/${machine}`);

        if (res.data.success) {
          setCurrent(res.data.data.current || 0);
          setTarget(res.data.data.target || 0);
        }
      } catch (error) {
        console.error("Live Metrics Error:", error);
      }
    };

    fetchLiveMetrics();

    const interval = setInterval(fetchLiveMetrics, 3000);

    return () => clearInterval(interval);
  }, [machine]);

  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  const progressColor = percentage >= 100 ? "bg-green-500" : percentage >= 75 ? "bg-blue-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-white max-w-45 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-base text-slate-800">{line}</h2>

        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">{machine}</span>
      </div>

      {/* Details */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Product</span>

          <span className="font-bold text-slate-800">{product}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500">Target</span>

          <span className="font-bold text-indigo-600">{target}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500">Current</span>

          <span className="font-bold text-green-600">{current}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Progress</span>

          <span className="font-bold text-slate-700">{percentage.toFixed(0)}%</span>
        </div>

        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`${progressColor} h-1.5 rounded-full transition-all duration-700`}
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
