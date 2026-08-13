"use client";

import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, Factory, Gauge, LayoutGrid, Sparkles, TrendingUp } from "lucide-react";
import { MetricCard, PageHeader, SectionCard, StatusPill } from "@/app/Planingsection/components/planningShared";

const modules = [
  { title: "Scheduler", description: "Machine time blocks, pending orders and plan details", href: "/Planingsection/Planning/scheduler", icon: CalendarDays, accent: "bg-blue-600" },
  { title: "Sales Orders", description: "Order backlog and planning priorities", href: "/Planingsection/Planning/sales-orders", icon: Factory, accent: "bg-indigo-600" },
  { title: "Machine Calendar", description: "Availability, load and maintenance slots", href: "/Planingsection/Planning/machine-calendar", icon: Activity, accent: "bg-orange-600" },
  { title: "Tool Calendar", description: "Tool reservations, life and maintenance", href: "/Planingsection/Planning/tool-calendar", icon: Gauge, accent: "bg-purple-600" },
  { title: "Capacity", description: "Available, planned and remaining capacity", href: "/Planingsection/Planning/capacity", icon: LayoutGrid, accent: "bg-emerald-600" },
  { title: "Simulation", description: "Compare planning scenarios and finish dates", href: "/Planingsection/Planning/simulation", icon: Sparkles, accent: "bg-amber-600" },
  { title: "KPI Dashboard", description: "OEE, utilization and delivery health", href: "/Planingsection/Planning/kpis", icon: TrendingUp, accent: "bg-slate-700" },
];

const recentActivity = [
  { title: "INJ-03 planned for 2 shifts", detail: "Order PO-2041 • 12,000 pcs", time: "10 min ago" },
  { title: "Tool MLD-02 maintenance window", detail: "Blocked until 18:00", time: "35 min ago" },
  { title: "Capacity available on INJ-07", detail: "+18% after changeover", time: "1 hr ago" },
];

const machineSnapshot = [
  { code: "INJ-01", mould: "MLD-02", clamp: "180 T", status: "Available" },
  { code: "INJ-03", mould: "MLD-05", clamp: "160 T", status: "Running" },
];

const mouldSnapshot = [
  { code: "MLD-02", remaining: "18,000 shots", status: "Healthy" },
  { code: "MLD-09", remaining: "7,200 shots", status: "Attention" },
];

export default function PlanningDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Planning & Scheduling" description="Manufacturing planning workspace with scheduler, capacity and reporting views" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="Open Orders" value="18" sub="8 need scheduling" icon={Factory} accent="text-blue-600" border="border-blue-400" />
          <MetricCard label="Machines Planned" value="11" sub="4 active today" icon={CalendarDays} accent="text-emerald-600" border="border-emerald-400" />
          <MetricCard label="Capacity Utilization" value="76%" sub="above target" icon={Gauge} accent="text-amber-600" border="border-amber-400" />
          <MetricCard label="Conflicts" value="3" sub="2 tool clashes" icon={Activity} accent="text-red-600" border="border-red-400" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <SectionCard title="Planning Workbench" subtitle="Core modules for the scheduling journey" actionLabel="Open scheduler" actionHref="/Planingsection/Planning/scheduler">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link key={module.href} href={module.href} className="rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-lg ${module.accent} flex items-center justify-center`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <ArrowRight size={14} className="text-gray-300" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-gray-800">{module.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">{module.description}</p>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Recent Activity" subtitle="Latest planning actions">
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.title} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
                    </div>
                    <StatusPill label={item.time} tone="slate" />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Machine & Mould Snapshot" subtitle="Current master-data context for scheduling decisions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Machines</p>
              <div className="mt-3 space-y-2">
                {machineSnapshot.map((machine) => (
                  <div key={machine.code} className="flex items-center justify-between text-sm text-gray-700">
                    <span className="font-semibold">{machine.code}</span>
                    <span className="text-xs text-gray-500">
                      {machine.mould} • {machine.clamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Moulds</p>
              <div className="mt-3 space-y-2">
                {mouldSnapshot.map((mould) => (
                  <div key={mould.code} className="flex items-center justify-between text-sm text-gray-700">
                    <span className="font-semibold">{mould.code}</span>
                    <span className="text-xs text-gray-500">
                      {mould.remaining} • {mould.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
