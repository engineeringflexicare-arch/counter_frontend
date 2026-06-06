import React from "react";

interface KPICardProps {
  label: string;
  value: string | number;
  rawValue?: number;
  sub: string;
  accent: string;
  icon: React.ReactNode;
  animate?: boolean;
}

export default function KPICard({ label, value, sub, accent, icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{label}</span>
        <div style={{ color: accent }}>{icon}</div>
      </div>

      <div>
        <div className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
          {value}
        </div>
        <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
