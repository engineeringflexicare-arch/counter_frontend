import React from "react";

interface KPICardProps {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  icon: React.ReactNode;
}

export default function KPICard({ label, value, sub, accent, icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">{label}</span>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: `${accent}15`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <h3
          className="text-2xl font-black leading-none"
          style={{
            color: accent,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {value}
        </h3>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}
