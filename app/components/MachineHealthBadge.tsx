"use client";

import React from "react";
import { Wifi, WifiOff, Clock, Activity, Cpu } from "lucide-react";

export interface MachineHealth {
  machineId: string | undefined;
  status: "online" | "offline";
  rssi?: number;
  uptime?: number;
  restartCount?: number;
  firmwareVersion?: string;
  ipAddress?: string;
  freeHeap?: number;
}

interface MachineHealthBadgeProps {
  health?: MachineHealth;
}

export default function MachineHealthBadge({ health }: MachineHealthBadgeProps) {
  if (!health) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full w-fit">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        <span>Unknown</span>
      </div>
    );
  }

  const isOnline = health.status === "online";
  const statusColor = isOnline ? "bg-green-500" : "bg-red-500";
  const badgeBg = isOnline ? "bg-green-100" : "bg-red-100";
  const textColor = isOnline ? "text-green-700" : "text-red-700";

  // Format uptime (seconds to hours:minutes)
  const formatUptime = (seconds?: number) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-xs ${badgeBg} ${textColor} px-3 py-1.5 rounded-md w-fit border ${isOnline ? "border-green-200" : "border-red-200"} shadow-sm transition-all hover:shadow-md`}
    >
      {/* Status Dot */}
      <div className="flex items-center gap-1.5 font-semibold">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${isOnline ? "animate-pulse" : ""}`}></div>
        <span className="capitalize">{health.status}</span>
      </div>

      {/* RSSI / WiFi */}
      {health.rssi !== undefined && (
        <div className="flex items-center gap-1" title="Signal Strength (RSSI)">
          {health.rssi > -70 ? <Wifi size={14} /> : health.rssi > -85 ? <Wifi size={14} className="opacity-70" /> : <WifiOff size={14} className="text-red-500" />}
          <span>{health.rssi} dBm</span>
        </div>
      )}

      {/* Uptime */}
      {health.uptime !== undefined && isOnline && (
        <div className="flex items-center gap-1" title="Uptime">
          <Clock size={14} />
          <span>{formatUptime(health.uptime)}</span>
        </div>
      )}

      {/* Restarts */}
      {health.restartCount !== undefined && (
        <div className="flex items-center gap-1" title="Restarts">
          <Activity size={14} />
          <span>{health.restartCount}</span>
        </div>
      )}

      {/* Free Heap */}
      {health.freeHeap !== undefined && (
        <div className="flex items-center gap-1" title="Free Memory (Heap)">
          <Cpu size={14} />
          <span>{(health.freeHeap / 1024).toFixed(1)} KB</span>
        </div>
      )}
    </div>
  );
}
