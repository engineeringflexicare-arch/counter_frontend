"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface ProductionTableProps {
  floor?: string;
  lineId?: string;
  date?: string;
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
  shiftEndTime: string;
  runNo?: number;
  runCount?: number;
  runStartTime?: string;
  runEndTime?: string;
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

interface ApiRunItem {
  runNo: number;
  startTime?: string;
  endTime?: string;
  totalOutput: number;
  // Per-run hourly breakdown returned by the backend. Each run carries
  // its OWN hourlyData array (zeros outside the hours it touched), which
  // must be used instead of the day-level aggregate so each run's row
  // shows only its own production, not every run repeating the same
  // combined whole-day numbers.
  hourlyData?: ApiHourlyItem[];
}

// 🔥 අලුත් generateShiftHours Function එක
const generateShiftHours = (startTime: string, endTime: string): string[] => {
  const hours: string[] = [];

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  // Night shift support
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const current = new Date(start);

  while (current < end) {
    const next = new Date(current);
    next.setHours(next.getHours() + 1);

    hours.push(
      `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}-${String(next.getHours() % 24).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`,
    );

    current.setHours(current.getHours() + 1);
  }

  return hours;
};

export default function ProductionTable({ floor = "Assembly_Floor", lineId, date }: ProductionTableProps) {
  const [rows, setRows] = useState<TableRow[]>([]);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const buildTableHtml = (): string => {
    const esc = (v: string | number) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const hourLabels = rows[0]?.shiftHours || [];

    const hourHeaders = hourLabels.flatMap((h) => [`${h} Out`, `${h} %`, `${h} Cum`]);
    const headerCells = ["Assembly Line", "Product Code", "Shift", "Start Time", "End Time", "Hourly Target", "Daily Target", "Total Output", "Progress (%)", ...hourHeaders];
    const thead = `<tr>${headerCells.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;

    const tbody = rows
      .map((row) => {
        const percentage = row.dailyTarget > 0 ? ((row.totalOutput / row.dailyTarget) * 100).toFixed(1) : "0.0";
        let cumulative = 0;
        const hourCells = row.shiftHours
          .map((hour) => {
            const hourlyOutput = row.hourlyData[hour] || 0;
            cumulative += hourlyOutput;
            const hourlyPercent = row.hourlyTarget > 0 ? ((hourlyOutput / row.hourlyTarget) * 100).toFixed(0) : "0";
            return `<td>${esc(hourlyOutput)}</td><td>${esc(hourlyPercent)}%</td><td>${esc(cumulative)}</td>`;
          })
          .join("");

        return `<tr>
          <td>${esc(row.assemblyLine)}</td>
          <td>${esc(row.productCode)}</td>
          <td>${esc(row.shift)}</td>
          <td>${esc(row.shiftStartTime)}</td>
          <td>${esc(row.shiftEndTime)}</td>
          <td>${esc(row.hourlyTarget)}</td>
          <td>${esc(row.dailyTarget)}</td>
          <td>${esc(row.totalOutput)}</td>
          <td>${esc(percentage)}%</td>
          ${hourCells}
        </tr>`;
      })
      .join("");

    return `<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11px;"><thead style="background:#dfe4d3;">${thead}</thead><tbody>${tbody}</tbody></table>`;
  };

  const reportTitle = `Production Report${date ? ` - ${date}` : ""}`;
  const fileBase = `production-report${date ? `-${date}` : ""}`;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    if (rows.length === 0) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>${buildTableHtml()}</body></html>`;
    downloadBlob(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), `${fileBase}.xls`);
  };

  const exportToWord = () => {
    if (rows.length === 0) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><title>${reportTitle}</title></head><body><h2 style="font-family:Arial,sans-serif;">${reportTitle}</h2>${buildTableHtml()}</body></html>`;
    downloadBlob(new Blob([html], { type: "application/msword;charset=utf-8" }), `${fileBase}.doc`);
  };

  const exportToPdf = () => {
    if (rows.length === 0) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><meta charset="UTF-8"><title>${reportTitle}</title><style>body{font-family:Arial,sans-serif;padding:16px;}h2{margin-bottom:12px;}table{width:100%;}th,td{text-align:center;}@media print{@page{size:landscape;}}</style></head><body><h2>${reportTitle}</h2>${buildTableHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.onload = () => {
      win.print();
      win.close();
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const linesRes = await axios.get(`${API_BASE_URL}/api/esp32/lines`);
        const linesData = linesRes.data.data || linesRes.data;

        if (!linesData || typeof linesData !== "object") return;

        const filteredData = lineId && linesData[lineId] ? { [lineId]: linesData[lineId] } : linesData;

        // Each line can now expand into MULTIPLE rows when the machine's
        // counter was reset mid-shift (one row per "run"). We build an
        // array of rows per line, then flatten at the end.
        const rowGroupPromises = Object.entries(filteredData).map(async ([lineKey, lineValue]): Promise<TableRow[]> => {
          const line = lineValue as ApiLineData;
          if (!line.machineId) return [];

          const startTime = line.shiftStartTime || "08:00";
          const endTime = line.shiftEndTime || "16:00";

          // 🔥 අලුත් Function එක භාවිතා කිරීම
          const shiftHours = generateShiftHours(startTime, endTime);

          const baseRow = {
            productCode: line.productCode || "-",
            plannedMembers: line.plannedMembers || 0,
            hourlyTarget: line.hourlyTarget || 0,
            dailyTarget: line.dailyTarget || 0,
            shift: line.shift || "-",
            shiftHours,
            shiftStartTime: startTime,
            shiftEndTime: endTime,
          };

          const lineLabel = lineKey.replaceAll("_", " ");

          try {
            // IMPORTANT: pass the line's real shiftStartTime/shiftEndTime
            // through to the backend so the hour buckets it builds use
            // the SAME label format as generateShiftHours() above (e.g.
            // "08:29-09:29" instead of an hour-aligned "08:00-09:00").
            // Without this, the hourlyData/runs[].hourlyData keys never
            // match shiftHours and every column silently shows 0.
            const params = new URLSearchParams();
            if (date) params.set("date", date);
            params.set("shiftStartTime", startTime);
            params.set("shiftEndTime", endTime);

            const url = `${API_BASE_URL}/api/esp32/hourly-production/${line.machineId}?${params.toString()}`;

            const res = await axios.get(url);

            if (!res.data?.success) {
              return [
                {
                  ...baseRow,
                  assemblyLine: lineLabel,
                  hourlyData: {},
                  totalOutput: 0,
                },
              ];
            }

            const hourlyMap: Record<string, number> = {};
            if (Array.isArray(res.data?.hourlyData)) {
              res.data.hourlyData.forEach((item: ApiHourlyItem) => {
                hourlyMap[item.hour] = item.output;
              });
            }

            const runs: ApiRunItem[] = Array.isArray(res.data?.runs) ? res.data.runs : [];

            // No reset detected (0 or 1 run) — keep the original single
            // row per line behaviour, using the whole-day hourlyMap.
            if (runs.length <= 1) {
              return [
                {
                  ...baseRow,
                  assemblyLine: lineLabel,
                  hourlyData: hourlyMap,
                  totalOutput: res.data.totalOutput || 0,
                },
              ];
            }

            // Reset happened mid-shift — show one row per run. Each run
            // gets its OWN hourly breakdown built from run.hourlyData
            // (not the shared day-level hourlyMap), so every row shows
            // only the hours that run actually produced in.
            return runs.map((run) => {
              const runHourlyMap: Record<string, number> = {};
              if (Array.isArray(run.hourlyData)) {
                run.hourlyData.forEach((item) => {
                  runHourlyMap[item.hour] = item.output;
                });
              }

              return {
                ...baseRow,
                assemblyLine: `${lineLabel} (Run ${run.runNo}/${runs.length})`,
                hourlyData: runHourlyMap,
                totalOutput: run.totalOutput,
                runNo: run.runNo,
                runCount: runs.length,
                runStartTime: run.startTime,
                runEndTime: run.endTime,
              };
            });
          } catch (error) {
            console.error(`Error fetching output for ${line.machineId}:`, error);
            return [
              {
                ...baseRow,
                assemblyLine: lineLabel,
                hourlyData: {},
                totalOutput: 0,
              },
            ];
          }
        });

        const resolvedRowGroups = await Promise.all(rowGroupPromises);
        const resolvedRows = resolvedRowGroups.flat();

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
  }, [floor, lineId, date, API_BASE_URL]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      <div className="flex justify-end gap-2 mb-3">
        <button
          onClick={exportToExcel}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
        >
          Export Excel
        </button>
        <button
          onClick={exportToWord}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          Export Word
        </button>
        <button
          onClick={exportToPdf}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
        >
          Export PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm border-collapse">
          <thead>
            <tr className="bg-[#dfe4d3] text-gray-700">
              <th className="border p-2">Assembly Line</th>
              <th className="border p-2">Product Code</th>
              <th className="border p-2">Total Output</th>
              <th className="border p-2">Progress (%)</th>
              <th className="border p-2">Start Time</th>
              <th className="border p-2">End Time</th>
              {/* 🔥 Header එක Dynamic ලෙස පෙන්වීම */}
              {rows[0]?.shiftHours.map((hour, i) => (
                <th key={i} className="border p-2 text-xs">
                  {hour}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const percentage = row.dailyTarget > 0 ? ((row.totalOutput / row.dailyTarget) * 100).toFixed(1) : "0.0";
              let cumulative = 0;
              return (
                <tr key={index} className="hover:bg-gray-50 text-gray-800">
                  <td className="border p-2 font-semibold">
                    {row.assemblyLine}
                    {row.runCount && row.runCount > 1 && <div className="text-[10px] font-normal text-amber-600 mt-0.5">Reset detected — {row.runCount} runs</div>}
                  </td>
                  <td className="border p-2">{row.productCode}</td>
                  <td className="border p-2 font-bold text-blue-700">{row.totalOutput}</td>
                  <td className="border p-2 font-bold text-purple-700">{percentage}%</td>
                  <td className="border p-2 font-bold text-green-600">{row.runStartTime ? row.runStartTime.split(" ")[1] || row.runStartTime : row.shiftStartTime}</td>
                  <td className="border p-2 font-bold text-red-600">{row.runEndTime ? row.runEndTime.split(" ")[1] || row.runEndTime : row.shiftEndTime}</td>

                  {row.shiftHours.map((hour, i) => {
                    const hourlyOutput = row.hourlyData[hour] || 0;
                    cumulative += hourlyOutput;
                    const hourlyPercent = row.hourlyTarget > 0 ? ((hourlyOutput / row.hourlyTarget) * 100).toFixed(0) : "0";
                    return (
                      <td key={i} className="border p-2">
                        <div className={`font-semibold ${hourlyOutput >= row.hourlyTarget ? "text-green-600" : "text-red-600"}`}>{hourlyOutput}</div>
                        <div className={`text-[10px] font-semibold ${hourlyOutput >= row.hourlyTarget ? "text-green-500" : "text-red-400"}`}>{hourlyPercent}%</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">{cumulative}</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
