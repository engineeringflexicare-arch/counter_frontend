"use client";

import axios from "axios";
import { useState, useEffect } from "react";

interface LineCardProps {
  line: string;
  product: string;
  machine: string;
  target: number;
  current: number;
}

export default function LineCard({ line, product, machine, target: propTarget, current: propCurrent }: LineCardProps) {
  // දත්ත තත්‍ය කාලීනව ලබා ගැනීමට state යොදා ගැනීම
  const [target, setTarget] = useState(propTarget);
  const [current, setCurrent] = useState(propCurrent);

  // සෑම තත්පර 3කට වරක් යන්ත්‍රයේ දත්ත යාවත්කාලීන කිරීම
  useEffect(() => {
    const fetchLiveMetrics = async () => {
      try {
        // ඔබේ Backend API එකෙන් අදාළ machine එකට අදාළ දත්ත ගැනීම
        const res = await axios.get(`http://localhost:3000/api/esp32/metrics/${machine}`);
        if (res.data.success) {
          setCurrent(res.data.data.current);
          setTarget(res.data.data.target);
        }
      } catch (err) {
        console.error("Error fetching live metrics:", err);
      }
    };

    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 3000);
    return () => clearInterval(interval);
  }, [machine]);

  // දත්ත ගණනය කිරීම්
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const progressColor = percentage >= 100 ? "bg-green-500" : percentage >= 70 ? "bg-blue-500" : percentage >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 w-full min-h-80 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
      {/* Header කොටස */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{line}</h2>
          <p className="text-gray-500 text-sm mt-1">Factory Floor Analytics</p>
        </div>
        <span className="bg-blue-100 text-blue-700 text-xs px-4 py-2 rounded-full font-semibold">{machine}</span>
      </div>

      {/* Product Code */}
      <div className="mt-6">
        <p className="text-gray-500 text-sm">Product Code</p>
        <h3 className="font-bold text-2xl text-gray-800 mt-1">{product}</h3>
      </div>

      {/* Stats (Target vs Current) */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-gray-100 rounded-2xl p-4">
          <p className="text-gray-500 text-sm">Target</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">{target}</h3>
        </div>
        <div className="bg-gray-100 rounded-2xl p-4">
          <p className="text-gray-500 text-sm">Current</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">{current}</h3>
        </div>
      </div>

      {/* Progress Bar කොටස */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Progress</span>
          <span className={`text-sm font-bold ${percentage >= 100 ? "text-green-600" : "text-gray-600"}`}>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className={`h-4 rounded-full transition-all duration-700 ${progressColor}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  );
}
