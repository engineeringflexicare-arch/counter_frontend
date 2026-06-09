interface ArcProgressProps {
  value: number;
  max: number;
  label: string;
  accent: "DAILY" | "ORDER" | "HOURLY" | "LIVE";
}

const colors = {
  DAILY: "#6366f1",
  ORDER: "#0ea5e9",
  HOURLY: "#f59e0b",
  LIVE: "#10b981",
};

export default function ArcProgress({ value, max, label, accent }: ArcProgressProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const color = colors[accent];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {/* Background */}
          <path
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
          />

          {/* Progress */}
          <path
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${percentage}, 100`}
            style={{
              transition: "stroke-dasharray 0.6s ease",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black" style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <span className="text-[8px] font-bold tracking-wider uppercase text-slate-400 mt-1">{label}</span>
    </div>
  );
}
