"use client";

import { Activity, AlertTriangle, CalendarDays, Wrench } from "lucide-react";
import { MetricCard, PageHeader, SectionCard } from "@/app/Planingsection/components/planningShared";

const machines = [
  { code: "INJ-01", load: 82, status: "Available", plan: "PO-2038", next: "14:00", mould: "MLD-02", clampForce: "180 T", material: "HDPE" },
  { code: "INJ-02", load: 66, status: "Maintenance", plan: "Tool Change", next: "18:00", mould: "MLD-09", clampForce: "220 T", material: "PP" },
  { code: "INJ-03", load: 91, status: "Busy", plan: "PO-2041", next: "22:00", mould: "MLD-05", clampForce: "160 T", material: "ABS" },
  { code: "INJ-04", load: 45, status: "Available", plan: "None", next: "10:00", mould: "MLD-03", clampForce: "200 T", material: "HDPE" },
];

export default function MachineCalendarPage() {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Available Machines" value="2" sub="ready for allocation" icon={CalendarDays} accent="text-blue-600" border="border-blue-400" />
          <MetricCard label="Maintenance" value="1" sub="tool room block" icon={Wrench} accent="text-red-600" border="border-red-400" />
          <MetricCard label="Average Load" value="71%" sub="across active machines" icon={Activity} accent="text-emerald-600" border="border-emerald-400" />
        </div>

        <SectionCard title="Machine Availability" subtitle="Current capacity windows">
          <div className="space-y-3">
            {machines.map((machine) => (
              <div key={machine.code} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{machine.code}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {machine.status} • {machine.plan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">{machine.load}%</p>
                    <p className="text-xs text-gray-400">Next: {machine.next}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${machine.load > 80 ? "bg-red-400" : machine.load > 60 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${machine.load}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Machine & Mould Details" subtitle="Master-data snapshot for planning decisions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {machines.map((machine) => (
              <div key={machine.code} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{machine.code}</p>
                    <p className="text-xs text-gray-500 mt-1">Mould {machine.mould}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{machine.clampForce}</p>
                    <p>{machine.material}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-semibold text-gray-700">{machine.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Slot</span>
                    <span className="font-semibold text-gray-700">{machine.next}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Maintenance" subtitle="Calendar pressure points">
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5" />
            INJ-02 is reserved for preventive maintenance from 18:00 to 20:00. Keep tool change and production blocks away from that slot.
          </div>
        </SectionCard>
    </div>
  );
}

