"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api"; // axios වෙනුවට api පමණක් භාවිත කිරීම
import { FileSpreadsheet, FileText, FileDown, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

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
  lineId?: string;
  floor?: string;
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
  hourlyData?: ApiHourlyItem[];
}

// ── Helpers ──────────────────────────────────────────────────

const generateShiftHours = (startTime: string, endTime: string): string[] => {
  const hours: string[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);
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

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductionTable({ floor = "Assembly_Floor", lineId, date }: ProductionTableProps) {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Export helpers ────────────────────────────────────────

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
          <td>${esc(row.assemblyLine)}</td><td>${esc(row.productCode)}</td>
          <td>${esc(row.shift)}</td><td>${esc(row.shiftStartTime)}</td>
          <td>${esc(row.shiftEndTime)}</td><td>${esc(row.hourlyTarget)}</td>
          <td>${esc(row.dailyTarget)}</td><td>${esc(row.totalOutput)}</td>
          <td>${esc(percentage)}%</td>${hourCells}
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
    if (!rows.length) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>${buildTableHtml()}</body></html>`;
    downloadBlob(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), `${fileBase}.xls`);
  };

  const exportToWord = () => {
    if (!rows.length) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><title>${reportTitle}</title></head><body><h2 style="font-family:Arial,sans-serif;">${reportTitle}</h2>${buildTableHtml()}</body></html>`;
    downloadBlob(new Blob([html], { type: "application/msword;charset=utf-8" }), `${fileBase}.doc`);
  };

  const exportToPdf = () => {
    if (!rows.length) return;
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

  // ── Data fetching ─────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        // "/api/esp32/lines" කියන endpoint එක backend එකේ නැහැ (404 දෙනවා).
        // සත්‍ය lines endpoint එක තියෙන්නේ LineRouter එකේ "/api/lines" කියලා.
        const linesRes = await api.get("/api/lines");
        const linesArray: ApiLineData[] = linesRes.data?.data || [];

        if (!Array.isArray(linesArray)) return;

        // "/api/lines" එකෙන් එන්නේ array එකක්, නමුත් මේ component එක
        // lineId එක key එක විදිහට තියෙන object එකක් අපේක්ෂා කරනවා.
        // ඒ වගේම floor එකට අදාළ lines විතරක් filter කරගන්නවා.
        const linesData: Record<string, ApiLineData> = {};
        linesArray
          .filter((line) => !floor || line.floor === floor || !line.floor)
          .forEach((line) => {
            if (line.lineId) {
              linesData[line.lineId] = line;
            }
          });

        const filteredData = lineId && linesData[lineId] ? { [lineId]: linesData[lineId] } : linesData;

        const rowGroupPromises = Object.entries(filteredData).map(async ([lineKey, lineValue]): Promise<TableRow[]> => {
          const line = lineValue as ApiLineData;
          if (!line.machineId) return [];

          const startTime = line.shiftStartTime || "08:00";
          const endTime = line.shiftEndTime || "16:00";
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
            const params = new URLSearchParams();
            if (date) params.set("date", date);
            params.set("shiftStartTime", startTime);
            params.set("shiftEndTime", endTime);

            // මෙහි axios වෙනුවට api භාවිතා කර ඇත. එසේම API_BASE_URL ඉවත් කර ඇත.
            const res = await api.get(`/api/esp32/hourly-production/${line.machineId}`, {
              params: params,
            });

            if (!res.data?.success) {
              return [{ ...baseRow, assemblyLine: lineLabel, hourlyData: {}, totalOutput: 0 }];
            }

            const hourlyMap: Record<string, number> = {};
            if (Array.isArray(res.data?.hourlyData)) {
              res.data.hourlyData.forEach((item: ApiHourlyItem) => {
                hourlyMap[item.hour] = item.output;
              });
            }

            const runs: ApiRunItem[] = Array.isArray(res.data?.runs) ? res.data.runs : [];

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
            return [{ ...baseRow, assemblyLine: lineLabel, hourlyData: {}, totalOutput: 0 }];
          }
        });

        const resolved = (await Promise.all(rowGroupPromises)).flat();
        if (isMounted) {
          setRows(resolved);
          setLoading(false);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [floor, lineId, date]);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
        Loading production data…
      </div>
    );
  }

  if (rows.length === 0) return <div className="p-10 text-center text-sm text-slate-400">No production data available.</div>;

  const hourLabels = rows[0]?.shiftHours || [];

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={exportToExcel}
          disabled={!rows.length}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Excel
        </button>
        <button
          onClick={exportToWord}
          disabled={!rows.length}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40"
        >
          <FileText className="h-3.5 w-3.5" />
          Word
        </button>
        <button
          onClick={exportToPdf}
          disabled={!rows.length}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full border-collapse text-center text-sm">
          {/* ── thead ── */}
          <thead>
            <tr className="bg-[#b8cbdd] text-gray-900 text-xs font-bold">
              <th className="border border-slate-700 px-3 py-2">Assembly Line</th>
              <th className="border border-slate-700 px-3 py-2">Product Code</th>
              <th className="border border-slate-700 px-3 py-2">Total Output</th>
              <th className="border border-slate-700 px-3 py-2">Progress (%)</th>
              <th className="border border-slate-700 px-3 py-2">Start Time</th>
              <th className="border border-slate-700 px-3 py-2">End Time</th>
              {hourLabels.map((hour, i) => (
                <th key={i} className="border border-slate-700 px-2 py-2 text-xs">
                  {hour}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── tbody ── */}
          <tbody>
            {rows.map((row, idx) => {
              const pct = row.dailyTarget > 0 ? ((row.totalOutput / row.dailyTarget) * 100).toFixed(1) : "0.0";
              const pctNum = parseFloat(pct);
              let cumulative = 0;

              return (
                <tr key={idx} className="hover:bg-gray-50 text-gray-800">
                  {/* Assembly line */}
                  <td className="border border-slate-700 px-3 py-2 font-semibold text-left">
                    {row.assemblyLine}
                    {row.runCount && row.runCount > 1 && <div className="text-[10px] font-normal text-amber-600 mt-0.5">Reset detected — {row.runCount} runs</div>}
                  </td>

                  {/* Product code */}
                  <td className="border border-slate-700 px-3 py-2">{row.productCode}</td>

                  {/* Total output */}
                  <td className="border border-slate-700 px-3 py-2 font-bold text-blue-700">{row.totalOutput}</td>

                  {/* Progress */}
                  <td className="border border-slate-700 px-3 py-2">
                    <span className={`font-bold ${pctNum >= 90 ? "text-teal-600" : pctNum >= 60 ? "text-amber-600" : "text-red-600"}`}>{pct}%</span>
                  </td>

                  {/* Start time */}
                  <td className="border border-slate-700 px-3 py-2 font-bold text-green-600">{row.runStartTime ? row.runStartTime.split(" ")[1] || row.runStartTime : row.shiftStartTime}</td>

                  {/* End time */}
                  <td className="border border-slate-700 px-3 py-2 font-bold text-red-600">{row.runEndTime ? row.runEndTime.split(" ")[1] || row.runEndTime : row.shiftEndTime}</td>

                  {/* Hourly cells — original 3-line layout */}
                  {row.shiftHours.map((hour, i) => {
                    const hourlyOutput = row.hourlyData[hour] || 0;
                    cumulative += hourlyOutput;
                    const hourlyPercent = row.hourlyTarget > 0 ? ((hourlyOutput / row.hourlyTarget) * 100).toFixed(0) : "0";
                    return (
                      <td key={i} className="border border-slate-700 px-2 py-2">
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

          {/* ── tfoot — Grand Total ── */}
          {(() => {
            const grandTotal = rows.reduce((sum, r) => sum + r.totalOutput, 0);
            const hourLabels = rows[0]?.shiftHours || [];
            return (
              <tfoot>
                <tr className="bg-[#ffffff] font-bold text-gray-800">
                  <td className="border border-slate-700 px-3 py-2 text-left">Total</td>
                  <td className="border border-slate-700 px-3 py-2" />
                  <td className="border border-slate-700 px-3 py-2 text-blue-700">{grandTotal.toLocaleString()}</td>
                  {/* Progress, Start, End — empty */}
                  <td className="border border-slate-700 px-3 py-2" />
                  <td className="border border-slate-700 px-3 py-2" />
                  <td className="border border-slate-700 px-3 py-2" />
                  {/* Per-hour totals across all rows */}
                  {hourLabels.map((hour, i) => {
                    const hourTotal = rows.reduce((sum, r) => sum + (r.hourlyData[hour] || 0), 0);
                    const avgTarget = rows.length > 0 ? rows[0].hourlyTarget : 0;
                    return (
                      <td key={i} className="border border-slate-700 px-2 py-2 text-center">
                        <div className={`font-bold ${hourTotal >= avgTarget * rows.length ? "text-green-700" : "text-red-600"}`}>{hourTotal}</div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>

      <p className="text-right text-xs text-slate-400">
        {rows.length} {rows.length === 1 ? "line" : "lines"} · refreshes every 60 s
      </p>
    </div>
  );
}
