"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Factory, PlayCircle, Wrench } from "lucide-react";
import { PageHeader, SectionCard, StatusPill } from "@/app/Planingsection/components/planningShared";

interface ScheduleBlock {
  id: string;
  machine: string;
  mouldCode?: string;
  title: string;
  orderNo: string;
  start: number;
  duration: number;
  status: "Planned" | "Running" | "Completed" | "Conflict";
  type: "Production" | "Maintenance" | "Tool Change" | "Downtime";
  detail: string;
}

const pendingOrders = [
  { id: "PO-2038", product: "GP0001", qty: "22,000", priority: "High" },
  { id: "PO-2041", product: "GP0003", qty: "12,000", priority: "Urgent" },
  { id: "PO-2044", product: "GP0010", qty: "8,400", priority: "Medium" },
];

const blocks: ScheduleBlock[] = [
  { id: "b1", machine: "INJ-01", mouldCode: "MLD-02", title: "Cap Production", orderNo: "PO-2038", start: 0, duration: 2, status: "Planned", type: "Production", detail: "Tool MLD-02 • 8 hrs" },
  { id: "b2", machine: "INJ-03", mouldCode: "MLD-05", title: "Runner Assembly", orderNo: "PO-2041", start: 2, duration: 2, status: "Running", type: "Production", detail: "Tool MLD-05 • Live" },
  { id: "b3", machine: "INJ-02", mouldCode: "MLD-09", title: "Tool Change", orderNo: "PO-2044", start: 3, duration: 1, status: "Conflict", type: "Tool Change", detail: "Maintenance overlap" },
  { id: "b4", machine: "INJ-04", mouldCode: "MLD-03", title: "Downtime", orderNo: "-", start: 5, duration: 1, status: "Completed", type: "Downtime", detail: "Cooling check" },
];

const machineDetails = {
  "INJ-01": { clampForce: "180 T", screwDiameter: "45 mm", material: "HDPE", size: "600x600", status: "Available" },
  "INJ-02": { clampForce: "220 T", screwDiameter: "50 mm", material: "PP", size: "700x700", status: "Maintenance" },
  "INJ-03": { clampForce: "160 T", screwDiameter: "40 mm", material: "ABS", size: "550x550", status: "Running" },
  "INJ-04": { clampForce: "200 T", screwDiameter: "48 mm", material: "HDPE", size: "650x650", status: "Available" },
  "INJ-05": { clampForce: "170 T", screwDiameter: "42 mm", material: "PC", size: "580x580", status: "Idle" },
};

const mouldDetails = {
  "MLD-02": { toolLife: "25,000 shots", remaining: "18,000 shots", maintenance: "12 Aug", status: "Healthy" },
  "MLD-03": { toolLife: "20,000 shots", remaining: "14,500 shots", maintenance: "14 Aug", status: "Healthy" },
  "MLD-05": { toolLife: "30,000 shots", remaining: "21,500 shots", maintenance: "18 Aug", status: "Healthy" },
  "MLD-09": { toolLife: "18,000 shots", remaining: "7,200 shots", maintenance: "Today", status: "Attention" },
};

const machines = ["INJ-01", "INJ-02", "INJ-03", "INJ-04", "INJ-05"];
const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

const statusStyles = {
  Planned: "blue",
  Running: "green",
  Completed: "slate",
  Conflict: "red",
} as const;

export default function SchedulerPage() {
  const [selected, setSelected] = useState<ScheduleBlock>(blocks[1]);

  const machineBlocks = useMemo(() => {
    return machines.map((machine) => ({ machine, items: blocks.filter((block) => block.machine === machine) }));
  }, []);

  const selectedMachineDetails = machineDetails[selected.machine as keyof typeof machineDetails] ?? machineDetails["INJ-01"];
  const selectedMouldDetails = mouldDetails[selected.mouldCode as keyof typeof mouldDetails] ?? mouldDetails["MLD-02"];

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_280px] gap-6">
          <SectionCard title="Pending Orders" subtitle="Ready to allocate">
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-700">{order.id}</p>
                    <StatusPill label={order.priority} tone={order.priority === "Urgent" ? "red" : order.priority === "High" ? "amber" : "blue"} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {order.product} • {order.qty} pcs
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Scheduler Timeline" subtitle="Machine view with production and maintenance blocks">
            <div className="overflow-x-auto">
              <div className="min-w-170 space-y-3">
                <div className="grid grid-cols-[90px_repeat(7,minmax(70px,1fr))] gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <div>Machine</div>
                  {timeSlots.map((slot) => (
                    <div key={slot} className="text-center">
                      {slot}
                    </div>
                  ))}
                </div>

                {machineBlocks.map(({ machine, items }) => (
                  <div key={machine} className="grid grid-cols-[90px_repeat(7,minmax(70px,1fr))] gap-2 items-center">
                    <div className="text-sm font-semibold text-gray-700">{machine}</div>
                    <div className="col-span-7 relative h-16 rounded-lg border border-gray-100 bg-gray-50">
                      {items.map((item) => {
                        const left = `${(item.start / timeSlots.length) * 100}%`;
                        const width = `${(item.duration / timeSlots.length) * 100}%`;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelected(item)}
                            className={`absolute top-2 bottom-2 rounded-lg border px-2 py-1 text-left text-[11px] shadow-sm transition-all ${item.status === "Conflict" ? "bg-red-50 border-red-200 text-red-700" : item.status === "Running" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
                            style={{ left, width }}
                          >
                            <div className="font-semibold truncate">{item.title}</div>
                            <div className="truncate text-[10px] opacity-80">{item.orderNo}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Plan Details" subtitle="Selected schedule block">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800">{selected.title}</p>
                <StatusPill label={selected.status} tone={statusStyles[selected.status]} />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Factory size={14} className="text-blue-500" />
                  {selected.machine}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock size={14} className="text-amber-500" />
                  {selected.orderNo}
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle size={14} className="text-emerald-500" />
                  {selected.type}
                </div>
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-slate-500" />
                  {selected.detail}
                </div>
              </div>
              {selected.status === "Conflict" && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5" />
                  Tool change overlaps with maintenance window. Review before confirming.
                </div>
              )}

              <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Machine Details</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between gap-2">
                    <span>Clamp Force</span>
                    <span className="font-semibold text-gray-700">{selectedMachineDetails.clampForce}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Screw Diameter</span>
                    <span className="font-semibold text-gray-700">{selectedMachineDetails.screwDiameter}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Material</span>
                    <span className="font-semibold text-gray-700">{selectedMachineDetails.material}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Size</span>
                    <span className="font-semibold text-gray-700">{selectedMachineDetails.size}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Status</span>
                    <span className="font-semibold text-gray-700">{selectedMachineDetails.status}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Mould Details</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between gap-2">
                    <span>Tool Life</span>
                    <span className="font-semibold text-gray-700">{selectedMouldDetails.toolLife}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Remaining</span>
                    <span className="font-semibold text-gray-700">{selectedMouldDetails.remaining}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Maintenance</span>
                    <span className="font-semibold text-gray-700">{selectedMouldDetails.maintenance}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Status</span>
                    <span className="font-semibold text-gray-700">{selectedMouldDetails.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
    </div>
  );
}
