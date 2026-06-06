import ArcProgress from "./ArcProgress";
import AnimatedNumber from "./AnimatedNumber";

interface GoalCompletionStatusProps {
  liveCount: number;
  daily: number;
  total: number;
  hourly: number;
  lineData?: {
    productCode?: string;
    productionStartTime?: string;
  } | null;
  dailyPct: number;
}

export default function GoalCompletionStatus({ liveCount, daily, total, hourly, lineData, dailyPct }: GoalCompletionStatusProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 mb-6 slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-2 mb-8">
        <span className="w-1.5 h-6 rounded-full bg-sky-500" />
        <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">Goal Completion Status</h2>
      </div>

      <div className="flex flex-wrap gap-8 justify-around items-center">
        <ArcProgress value={liveCount} max={daily} label="Daily Goal" accent="DAILY" />
        <ArcProgress value={liveCount} max={total} label="Total Order" accent="ORDER" />
        <ArcProgress value={liveCount} max={hourly} label="Hourly Rate" accent="HOURLY" />

        {/* Big live count display */}
        <div className="flex flex-col items-center bg-slate-50 px-8 py-5 rounded-2xl border border-slate-100">
          <div className="text-5xl font-black tracking-tighter text-slate-900" style={{ fontFamily: "'DM Mono', monospace" }}>
            <AnimatedNumber value={liveCount} />
          </div>
          <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-2">Total Units Produced</div>
          <div className="mt-3 flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <span className="pulse-dot w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
            <span className="text-[10px] text-emerald-600 font-bold tracking-wider">LIVE FEED</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-50">
          {[
            { label: "Remaining (Daily)", value: Math.max(daily - liveCount, 0), color: "#6366f1" },
            { label: "Completion Rate", value: `${dailyPct}%`, color: "#0ea5e9" },
            { label: "Product Code", value: lineData?.productCode ?? "—", color: "#f59e0b" },
            { label: "Start Time", value: lineData?.productionStartTime ?? "—", color: "#10b981" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">{row.label}</span>
              <span className="text-sm font-black" style={{ color: row.color, fontFamily: "'DM Mono', monospace" }}>
                {typeof row.value === "number" ? row.value.toLocaleString() : row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
