import React from "react";

// API වෙතින් ලැබෙන දත්තවල හැඩය
interface LineData {
  productCode?: string;
  floor?: string;
  shift?: string;
  productionStartTime?: string;
  supervisor?: string;
  machineId?: string;
  plannedMembers?: number | string;
}

interface LineConfigProps {
  lineData: LineData | null;
}

export default function LineConfig({ lineData }: LineConfigProps) {
  // Config දත්ත Array එක
  const configItems: [string, string | undefined, string][] = [
    ["Product Code", lineData?.productCode, "#f59e0b"],
    ["Floor", lineData?.floor?.replace("_", " "), "#0ea5e9"],
    ["Shift", lineData?.shift, "#6366f1"],
    ["Production Start", lineData?.productionStartTime, "#10b981"],
    ["Supervisor", lineData?.supervisor, "#f43f5e"],
    ["Machine ID", lineData?.machineId, "#8b5cf6"],
    ["Planned Members", lineData?.plannedMembers?.toString(), "#0ea5e9"],
  ];

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-1.5 h-6 rounded-full bg-emerald-500" />
        <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Line Configuration</h2>
      </div>

      <div className="space-y-2">
        {configItems.map(([key, val, accent]) => (
          <div key={key} className="flex justify-between items-center px-5 py-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
            <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase group-hover:text-slate-700 transition-colors">{key}</span>
            <span className="text-sm font-black" style={{ color: accent, fontFamily: "'DM Mono', monospace" }}>
              {val ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
