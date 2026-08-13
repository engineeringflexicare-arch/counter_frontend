"use client";

import { LineData } from "@/types/Supervisor";
import Link from "next/link";
import MachineHealthBadge from "../MachineHealthBadge";

interface LineStatusCardProps {
  line: LineData;
  supervisorPath: "assembly-supervisor" | "production-supervisor";
}

export default function LineStatusCard({ line, supervisorPath }: LineStatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "idle":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "maintenance":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const productionGap = line.production.target - line.production.actual;
  const gapPercentage = ((productionGap / line.production.target) * 100).toFixed(1);

  return (
    <Link href={`/${supervisorPath}/${line.id}`}>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-blue-500">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{line.name}</h3>
            <p className="text-sm text-gray-600">Line ID: {line.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(line.status)}`}>{line.status.charAt(0).toUpperCase() + line.status.slice(1)}</span>
        </div>

        {/* Production Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Actual</p>
            <p className="text-2xl font-bold text-blue-600">{line.production.actual}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Target</p>
            <p className="text-2xl font-bold text-green-600">{line.production.target}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Gap</p>
            <p className={`text-2xl font-bold ${productionGap > 0 ? "text-red-600" : "text-green-600"}`}>
              {productionGap > 0 ? "-" : "+"}
              {gapPercentage}%
            </p>
          </div>
        </div>

        {/* Efficiency Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-600 uppercase tracking-wide">Efficiency</p>
            <p className="text-sm font-semibold text-gray-800">{line.production.efficiency}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${line.production.efficiency}%` }} />
          </div>
        </div>

        {/* Machines */}
        <div className="border-t pt-4">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">Machines</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {line.machines.map((machine) => (
              <MachineHealthBadge key={machine.id} name={machine.name} status={machine.status} oee={machine.oee} />
            ))}
          </div>
        </div>

        {/* Shift Info */}
        <div className="mt-4 pt-4 border-t text-xs text-gray-600">
          <p>Supervisor: {line.shift.supervisor}</p>
        </div>
      </div>
    </Link>
  );
}
