"use client";

import { Activity, ArrowUpRight, BarChart3, CalendarClock, Clock3, PackageCheck } from "lucide-react";
import { PageHeader, SectionCard } from "@/app/Planingsection/components/planningShared";
import { OeeChart, TrendChart } from "@/app/Planingsection/components/planningErp";

const trend = [
  { label: "Mon", value: 71 },
  { label: "Tue", value: 74 },
  { label: "Wed", value: 76 },
  { label: "Thu", value: 79 },
  { label: "Fri", value: 82 },
  { label: "Sat", value: 85 },
];

const oee = [
  { label: "Mon", value: 67 },
  { label: "Tue", value: 70 },
  { label: "Wed", value: 72 },
  { label: "Thu", value: 74 },
  { label: "Fri", value: 78 },
  { label: "Sat", value: 81 },
];

export default function KpiDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Planning KPI Dashboard" description="Operational health metrics for delivery, utilization and schedule reliability" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">Planning Accuracy</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">92%</p>
          <p className="mt-1 text-xs text-gray-500">Above weekly target</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">Capacity Utilization</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">77%</p>
          <p className="mt-1 text-xs text-gray-500">Balanced with buffer</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">OEE</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">81%</p>
          <p className="mt-1 text-xs text-gray-500">Steady increase</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">Delivery Health</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">On time</p>
          <p className="mt-1 text-xs text-gray-500">4 orders due this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <SectionCard title="Utilization trend" subtitle="Capacity performance over the week">
          <TrendChart data={trend} color="#10b981" />
        </SectionCard>
        <SectionCard title="OEE trend" subtitle="Equipment effectiveness across the shift">
          <OeeChart data={oee} />
        </SectionCard>
      </div>

      <SectionCard title="Planning actions" subtitle="Recommended next steps for the team">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <CalendarClock size={16} />
              <p className="text-sm font-semibold text-gray-800">Rebalance schedule</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">Move one urgent order into the next open window.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <PackageCheck size={16} />
              <p className="text-sm font-semibold text-gray-800">Reduce downtime</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">Protect the maintenance window before the evening shift.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock3 size={16} />
              <p className="text-sm font-semibold text-gray-800">Reserve buffer</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">Leave a 6-hour slack for rush orders and changeovers.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
