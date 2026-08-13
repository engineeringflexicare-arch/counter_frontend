"use client";

import { Activity, CalendarClock, Gauge, Sparkles } from "lucide-react";
import { PageHeader, SectionCard } from "@/app/Planingsection/components/planningShared";
import { SimulationPanel } from "@/app/Planingsection/components/planningErp";

const scenarios = [
  {
    name: "Scenario A",
    metrics: [
      { label: "Finish Date", value: "18 Aug" },
      { label: "Capacity", value: "84%" },
      { label: "Delivery", value: "On time" },
    ],
  },
  {
    name: "Scenario B",
    metrics: [
      { label: "Finish Date", value: "19 Aug" },
      { label: "Capacity", value: "77%" },
      { label: "Delivery", value: "At risk" },
    ],
  },
  {
    name: "Scenario C",
    metrics: [
      { label: "Finish Date", value: "17 Aug" },
      { label: "Capacity", value: "91%" },
      { label: "Delivery", value: "Early" },
    ],
  },
];

export default function SimulationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Simulation" description="Compare planning scenarios and their operational impact before committing" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <CalendarClock size={16} />
            <p className="text-sm font-semibold text-gray-800">Fastest finish</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">17 Aug</p>
          <p className="mt-1 text-xs text-gray-500">Scenario C with overtime support</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <Gauge size={16} />
            <p className="text-sm font-semibold text-gray-800">Best utilization</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">91%</p>
          <p className="mt-1 text-xs text-gray-500">Highest load but lowest risk</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <Activity size={16} />
            <p className="text-sm font-semibold text-gray-800">Most conservative</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">19 Aug</p>
          <p className="mt-1 text-xs text-gray-500">Scenario B maintains buffer</p>
        </div>
      </div>

      <SectionCard title="Scenario Comparison" subtitle="Evaluate different planning assumptions">
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <SimulationPanel key={scenario.name} scenario={scenario.name} metrics={scenario.metrics} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
