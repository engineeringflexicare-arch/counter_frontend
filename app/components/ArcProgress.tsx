interface ArcProgressProps {
  value: number;
  max: number;
  label: string;
  accent: "DAILY" | "ORDER" | "HOURLY";
}

const colors = {
  DAILY: "#6366f1",
  ORDER: "#0ea5e9",
  HOURLY: "#f59e0b",
};

export default function ArcProgress({ value, max, label, accent }: ArcProgressProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = colors[accent];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          <path
            style={{ stroke: color, transition: "stroke-dasharray 0.5s ease" }}
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-2">{label}</span>
    </div>
  );
}
