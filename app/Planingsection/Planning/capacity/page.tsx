"use client";

import { Activity, AlertCircle, Boxes, Gauge, PackageCheck } from "lucide-react";
import { PageHeader, SectionCard } from "@/app/Planingsection/components/planningShared";
import { CapacityWidget, TrendChart, LoadChart } from "@/app/Planingsection/components/planningErp";

const capacityData = [
  { label: "Mon", value: 74 },
  { label: "Tue", value: 81 },
  { label: "Wed", value: 78 },
  { label: "Thu", value: 86 },
  { label: "Fri", value: 79 },
  { label: "Sat", value: 88 },
];

const machineLoad = [
  { label: "INJ-01", value: 82 },
  { label: "INJ-02", value: 64 },
  { label: "INJ-03", value: 91 },
  { label: "INJ-04", value: 47 },
  { label: "INJ-05", value: 74 },
];

export default function CapacityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Capacity Planning" description="Understand available capacity, remaining load and bottlenecks for the next window" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CapacityWidget title="Available Capacity" value="184 hrs" sub="Across 5 machines" tone="blue" />
        <CapacityWidget title="Planned Capacity" value="142 hrs" sub="Scheduled today" tone="green" />
        <CapacityWidget title="Remaining Capacity" value="42 hrs" sub="Buffer for rush orders" tone="amber" />
        <CapacityWidget title="Machine Utilization" value="77%" sub="Target 75%" tone="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <SectionCard title="Capacity Trend" subtitle="Weekly load trend across shifts">
          <TrendChart data={capacityData} color="#2563eb" />
        </SectionCard>
        <SectionCard title="Machine Load" subtitle="Current machine utilization">
          <LoadChart data={machineLoad} />
        </SectionCard>
      </div>

      <SectionCard title="Capacity Health" subtitle="Operational notes for planners">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <PackageCheck size={16} />
              <p className="text-sm font-semibold text-gray-800">Balanced loading</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">Two machines are still available for same-day reallocation.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle size={16} />
              <p className="text-sm font-semibold text-gray-800">Bottleneck risk</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">INJ-03 is running above target and could delay late orders.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Boxes size={16} />
              <p className="text-sm font-semibold text-gray-800">Pending material</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">Two moulds require material review before the next shift.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
