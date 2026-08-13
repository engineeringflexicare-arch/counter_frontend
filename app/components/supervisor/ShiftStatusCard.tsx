"use client";

import { ShiftData } from "@/types/Supervisor";

interface ShiftStatusCardProps {
  shift: ShiftData;
}

export default function ShiftStatusCard({ shift }: ShiftStatusCardProps) {
  const getShiftLabel = (shiftNumber: 1 | 2 | 3) => {
    const labels = { 1: "Morning", 2: "Afternoon", 3: "Night" };
    return labels[shiftNumber];
  };

  const timeRemaining = () => {
    const end = new Date(shift.endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Shift {getShiftLabel(shift.shiftNumber)}</h3>
          <p className="text-sm text-gray-600">Supervised by: {shift.supervisor.name}</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Active</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Start Time</p>
          <p className="text-sm font-semibold text-gray-800">
            {new Date(shift.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">End Time</p>
          <p className="text-sm font-semibold text-gray-800">
            {new Date(shift.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Time Remaining</p>
          <p className="text-sm font-semibold text-blue-600">{timeRemaining()}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Active Lines</p>
        <p className="text-xl font-bold text-gray-800">{shift.lines.length}</p>
      </div>
    </div>
  );
}
