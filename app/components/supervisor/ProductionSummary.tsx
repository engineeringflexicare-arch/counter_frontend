"use client";

import { ProductionMetrics } from "@/types/Supervisor";
import AnimatedNumber from "../AnimatedNumber";

interface ProductionSummaryProps {
  metrics: ProductionMetrics;
  type?: "assembly" | "production";
}

export default function ProductionSummary({ metrics, type = "production" }: ProductionSummaryProps) {
  const efficiency = Math.round(metrics.efficiency);
  const oee = Math.round(metrics.oee);
  const gap = metrics.targetProduction - metrics.totalProduction;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Production */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Total Production</p>
        <div className="text-3xl font-bold text-blue-600 mb-2">
          <AnimatedNumber value={metrics.totalProduction} />
        </div>
        <p className="text-xs text-gray-500">Units produced today</p>
      </div>

      {/* Target Production */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Target</p>
        <div className="text-3xl font-bold text-green-600 mb-2">
          <AnimatedNumber value={metrics.targetProduction} />
        </div>
        <p className="text-xs text-gray-500">{gap > 0 ? `${gap} units behind` : `${Math.abs(gap)} units ahead`}</p>
      </div>

      {/* Efficiency */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Efficiency</p>
        <div className="text-3xl font-bold text-purple-600 mb-2">{efficiency}%</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(efficiency, 100)}%` }} />
        </div>
      </div>

      {/* OEE */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">OEE</p>
        <div className="text-3xl font-bold text-orange-600 mb-2">{oee}%</div>
        <p className="text-xs text-gray-500">Overall Equipment Effectiveness</p>
      </div>
    </div>
  );
}
