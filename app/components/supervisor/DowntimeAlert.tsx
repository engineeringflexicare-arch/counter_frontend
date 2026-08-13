"use client";

import { DowntimeAlert } from "@/types/Supervisor";

interface DowntimeAlertProps {
  alerts: DowntimeAlert[];
  maxDisplay?: number;
}

export default function DowntimeAlertComponent({ alerts, maxDisplay = 5 }: DowntimeAlertProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-red-600 bg-red-50";
      case "high":
        return "border-l-orange-600 bg-orange-50";
      case "medium":
        return "border-l-yellow-600 bg-yellow-50";
      case "low":
        return "border-l-blue-600 bg-blue-50";
      default:
        return "border-l-gray-600 bg-gray-50";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const displayedAlerts = alerts.slice(0, maxDisplay);
  const moreAlerts = Math.max(0, alerts.length - maxDisplay);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Downtime Alerts</h3>
        {alerts.length > 0 && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">{alerts.length} Active</span>}
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-600 text-center py-8">✓ No downtime alerts</p>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">Line {alert.lineId}</p>
                    {alert.machineId && <p className="text-xs text-gray-600">| Machine {alert.machineId}</p>}
                  </div>
                  <p className="text-sm text-gray-700">{alert.reason}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getSeverityBadgeColor(alert.severity)}`}>{alert.severity.toUpperCase()}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-600">
                <div>
                  <span className="font-semibold">Duration:</span> {formatDuration(alert.duration)}
                </div>
                <div>
                  <span className="font-semibold">Type:</span> {alert.type === "planned" ? "📅 Planned" : "⚠️ Unplanned"}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> {alert.status === "ongoing" ? "🔴 Ongoing" : "✓ Resolved"}
                </div>
              </div>
            </div>
          ))}

          {moreAlerts > 0 && (
            <p className="text-center text-sm text-gray-600 pt-2">
              +{moreAlerts} more alert{moreAlerts !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
