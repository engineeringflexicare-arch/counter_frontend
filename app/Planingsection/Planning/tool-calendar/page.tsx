"use client";

import { AlertTriangle, CalendarDays, Sparkles, Wrench } from "lucide-react";
import { PageHeader, SectionCard } from "@/app/Planingsection/components/planningShared";

const tools = [
  { code: "MLD-02", machine: "INJ-01", life: "18,000 shots", status: "Healthy", next: "12 Aug" },
  { code: "MLD-05", machine: "INJ-03", life: "21,500 shots", status: "Watch", next: "14 Aug" },
  { code: "MLD-09", machine: "INJ-02", life: "7,200 shots", status: "Maintenance", next: "Today" },
];

export default function ToolCalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tool Calendar" description="Track mould availability, maintenance windows and replacement readiness" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <CalendarDays size={16} />
            <p className="text-sm font-semibold text-gray-800">Upcoming maintenance</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">2</p>
          <p className="mt-1 text-xs text-gray-500">This week</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={16} />
            <p className="text-sm font-semibold text-gray-800">At-risk tools</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">1</p>
          <p className="mt-1 text-xs text-gray-500">Needs attention immediately</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <Sparkles size={16} />
            <p className="text-sm font-semibold text-gray-800">Healthy tools</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">2</p>
          <p className="mt-1 text-xs text-gray-500">Ready for planned runs</p>
        </div>
      </div>

      <SectionCard title="Tool reserve calendar" subtitle="Live mould and tooling outlook">
        <div className="space-y-3">
          {tools.map((tool) => (
            <div key={tool.code} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{tool.code}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Machine {tool.machine} • {tool.life}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p className="font-semibold">{tool.status}</p>
                  <p className="text-xs text-gray-400">Next {tool.next}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
