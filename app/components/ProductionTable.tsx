"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface ProductionTableProps {
  floor?: string;
  lineId?: string;
}

interface TableRow {
  assemblyLine: string;
  productCode: string;
  plannedMembers: number;
  hourlyTarget: number;
  dailyTarget: number;
  hourlyData: Record<string, number>;
  totalOutput: number;
  shift: string;
  shiftHours: string[];
  shiftStartTime: string;
}

interface ApiLineData {
  machineId?: string;
  shift?: string;
  productCode?: string;
  plannedMembers?: number;
  hourlyTarget?: number;
  dailyTarget?: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

interface ApiHourlyItem {
  hour: string;
  output: number;
}

// 1. Shift ආරම්භක වේලාව අනුව පැය 12ක් ගණනය කිරීම
const generateShiftHours = (startTime: string, count: number): string[] => {
  const hours: string[] = [];
  const startH = parseInt(startTime.split(":")[0]);

  for (let i = 0; i < count; i++) {
    const currentH = (startH + i) % 24;
    const nextH = (currentH + 1) % 24;
    hours.push(`${String(currentH).padStart(2, "0")}:00-${String(nextH).padStart(2, "0")}:00`);
  }
  return hours;
};

export default function ProductionTable({ floor = "Assembly_Floor", lineId }: ProductionTableProps) {
  const [rows, setRows] = useState<TableRow[]>([]);
  const maxHours = 12;

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const linesRes = await axios.get("http://localhost:3000/api/esp32/lines");
        const linesData = linesRes.data.data || linesRes.data;

        if (!linesData || typeof linesData !== "object") return;

        const filteredData = lineId && linesData[lineId] ? { [lineId]: linesData[lineId] } : linesData;

        const rowPromises = Object.entries(filteredData).map(async ([lineKey, lineValue]) => {
          const line = lineValue as ApiLineData;
          if (!line.machineId) return null;

          const startTime = line.shiftStartTime || "08:00";
          const shiftHours = generateShiftHours(startTime, maxHours);

          const hourlyMap: Record<string, number> = {};
          let totalDayOutput = 0;

          try {
            const res = await axios.get(`http://localhost:3000/api/esp32/total-output/${line.machineId}`);
            if (res.data?.success && Array.isArray(res.data?.hourlyData)) {
              totalDayOutput = res.data.totalOutput || 0;
              res.data.hourlyData.forEach((item: ApiHourlyItem) => {
                hourlyMap[item.hour] = item.output;
              });
            }
          } catch (error) {
            console.error(`Error fetching output for ${line.machineId}:`, error);
          }

          return {
            assemblyLine: lineKey.replaceAll("_", " "),
            productCode: line.productCode || "-",
            plannedMembers: line.plannedMembers || 0,
            hourlyTarget: line.hourlyTarget || 0,
            dailyTarget: line.dailyTarget || 0,
            hourlyData: hourlyMap,
            totalOutput: totalDayOutput,
            shift: line.shift || "-",
            shiftHours,
            shiftStartTime: startTime,
          } as TableRow;
        });

        const resolvedRows = (await Promise.all(rowPromises)).filter((row): row is TableRow => row !== null);
        if (isMounted) setRows(resolvedRows);
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [floor, lineId]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      <table className="w-full text-center text-sm border-collapse">
        <thead>
          <tr className="bg-[#dfe4d3] text-gray-700">
            <th className="border p-2">Assembly Line</th>
            <th className="border p-2">Product Code</th>
            <th className="border p-2">Total Output</th>
            <th className="border p-2">Progress (%)</th>
            <th className="border p-2">Start Time</th>
            {/* Header එකෙහි පැය අනුපිළිවෙල පෙන්වීම */}
            {Array.from({ length: maxHours }).map((_, i) => (
              <th key={i} className="border p-2 text-xs">
                {rows[0]?.shiftHours[i]?.split("-")[0] || `H${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const percentage = row.dailyTarget > 0 ? ((row.totalOutput / row.dailyTarget) * 100).toFixed(1) : "0.0";
            return (
              <tr key={index} className="hover:bg-gray-50 text-gray-800">
                <td className="border p-2 font-semibold">{row.assemblyLine}</td>
                <td className="border p-2">{row.productCode}</td>
                <td className="border p-2 font-bold text-blue-700">{row.totalOutput}</td>
                <td className="border p-2 font-bold text-purple-700">{percentage}%</td>
                <td className="border p-2 font-bold text-green-600">{row.shiftStartTime}</td>
                {row.shiftHours.map((hour, i) => (
                  <td key={i} className="border p-2">
                    <div className={`font-semibold ${(row.hourlyData[hour] || 0) >= row.hourlyTarget ? "text-green-600" : "text-red-600"}`}>{row.hourlyData[hour] || 0}</div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
