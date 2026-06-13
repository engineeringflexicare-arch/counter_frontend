"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// 1. මෙතන date prop එක අලුතින් එකතු කර ඇත
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

// 2. Props වලට date එක ලබා ගැනීම
export default function ProductionTable({ floor = "Assembly_Floor", lineId, date }: ProductionTableProps) {
  const [rows, setRows] = useState<TableRow[]>([]);
  const maxHours = 12;

  // නිවැරදි කළ නම: NEXT_PUBLIC_API_BASE_URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // සියලුම export ආකාර (Excel / Word / PDF) සඳහා පොදුවේ පාවිච්චි වන table HTML එක නිර්මාණය කිරීම
  const buildTableHtml = (): string => {
    const esc = (v: string | number) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const hourLabels = rows[0]?.shiftHours.map((h) => h.split("-")[0]) || [];

    // එක් එක් පැයට Output, Progress %, Cumulative යන තීරු 3ක්
    const hourHeaders = hourLabels.flatMap((h) => [`${h} Out`, `${h} %`, `${h} Cum`]);
    const headerCells = ["Assembly Line", "Product Code", "Shift", "Start Time", "Hourly Target", "Daily Target", "Total Output", "Progress (%)", ...hourHeaders];
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
        return `<tr><td>${esc(row.assemblyLine)}</td><td>${esc(row.productCode)}</td><td>${esc(row.shift)}</td><td>${esc(row.shiftStartTime)}</td><td>${esc(row.hourlyTarget)}</td><td>${esc(row.dailyTarget)}</td><td>${esc(row.totalOutput)}</td><td>${esc(percentage)}%</td>${hourCells}</tr>`;
      })
      .join("");

    return `<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11px;"><thead style="background:#dfe4d3;">${thead}</thead><tbody>${tbody}</tbody></table>`;
  };

  const reportTitle = `Production Report${date ? ` - ${date}` : ""}`;
  const fileBase = `production-report${date ? `-${date}` : ""}`;

  // සැකසූ Blob එකක් download කිරීම
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel sheet එකකට export කිරීම (dependency එකක් අවශ්‍ය නැත — Excel විසින් HTML table එකක් open කරයි)
  const exportToExcel = () => {
    if (rows.length === 0) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>${buildTableHtml()}</body></html>`;
    downloadBlob(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), `${fileBase}.xls`);
  };

  // Word document එකකට export කිරීම (Word විසින් HTML open කරයි)
  const exportToWord = () => {
    if (rows.length === 0) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><title>${reportTitle}</title></head><body><h2 style="font-family:Arial,sans-serif;">${reportTitle}</h2>${buildTableHtml()}</body></html>`;
    downloadBlob(new Blob([html], { type: "application/msword;charset=utf-8" }), `${fileBase}.doc`);
  };

  // PDF එකකට export කිරීම (print window එකක් විවෘත කර browser එකේ "Save as PDF" භාවිතා කරයි)
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

        const rowPromises = Object.entries(filteredData).map(async ([lineKey, lineValue]) => {
          const line = lineValue as ApiLineData;
          if (!line.machineId) return null;

          const startTime = line.shiftStartTime || "08:00";
          const shiftHours = generateShiftHours(startTime, maxHours);

          const hourlyMap: Record<string, number> = {};
          let totalDayOutput = 0;

          try {
            // 3. API URL එකට date එක query parameter එකක් විදිහට එකතු කිරීම
            let url = `${API_BASE_URL}/api/esp32/hourly-production/${line.machineId}`;
            if (date) {
              url += `?date=${date}`;
            }

            const res = await axios.get(url);
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
  }, [floor, lineId, date, API_BASE_URL]); // 4. Dependency array එකට date එක එකතු කිරීම

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      {/* Export buttons */}
      <div className="flex justify-end gap-2 mb-3">
        <button
          onClick={exportToExcel}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export Excel
        </button>
        <button
          onClick={exportToWord}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export Word
        </button>
        <button
          onClick={exportToPdf}
          disabled={rows.length === 0}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              let cumulative = 0; // එක් එක් පැයට අදාළ සමුච්චිත (cumulative) ගණන
              return (
                <tr key={index} className="hover:bg-gray-50 text-gray-800">
                  <td className="border p-2 font-semibold">{row.assemblyLine}</td>
                  <td className="border p-2">{row.productCode}</td>
                  <td className="border p-2 font-bold text-blue-700">{row.totalOutput}</td>
                  <td className="border p-2 font-bold text-purple-700">{percentage}%</td>
                  <td className="border p-2 font-bold text-green-600">{row.shiftStartTime}</td>
                  {row.shiftHours.map((hour, i) => {
                    const hourlyOutput = row.hourlyData[hour] || 0;
                    cumulative += hourlyOutput;
                    // එම පැයේ ඉලක්කයට අදාළ ප්‍රගති ප්‍රතිශතය
                    const hourlyPercent = row.hourlyTarget > 0 ? ((hourlyOutput / row.hourlyTarget) * 100).toFixed(0) : "0";
                    return (
                      <td key={i} className="border p-2">
                        <div className={`font-semibold ${hourlyOutput >= row.hourlyTarget ? "text-green-600" : "text-red-600"}`}>{hourlyOutput}</div>
                        {/* එම පැයේ ඉලක්කය සපුරා ඇති ප්‍රතිශතය */}
                        <div className={`text-[10px] font-semibold ${hourlyOutput >= row.hourlyTarget ? "text-green-500" : "text-red-400"}`}>{hourlyPercent}%</div>
                        {/* එම පැය දක්වා එකතු වූ සමුච්චිත ගණන */}
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
