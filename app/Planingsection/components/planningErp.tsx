"use client";

import { ArrowRight, CheckCircle2, Clock3, Factory, AlertTriangle, CalendarDays, Gauge, PlayCircle, Sparkles, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

export function PlanningMetric({ label, value, sub, icon: Icon, tone }: { label: string; value: string | number; sub?: string; icon: LucideIcon; tone: "blue" | "green" | "amber" | "red" | "slate" }) {
  const toneStyles = {
    blue: "border-blue-400 bg-blue-50 text-blue-700",
    green: "border-emerald-400 bg-emerald-50 text-emerald-700",
    amber: "border-amber-400 bg-amber-50 text-amber-700",
    red: "border-red-400 bg-red-50 text-red-700",
    slate: "border-slate-400 bg-slate-50 text-slate-700",
  } as const;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`rounded-xl border p-2 ${toneStyles[tone]}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

export function OrderCard({ order, onSelect }: { order: { id: string; product: string; customer: string; qty: string; priority: string; due: string }; onSelect?: () => void }) {
  const priorityTone = order.priority === "Urgent" ? "red" : order.priority === "High" ? "amber" : "blue";
  return (
    <button type="button" onClick={onSelect} className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-blue-200 hover:bg-white">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">{order.id}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityTone === "red" ? "bg-red-50 text-red-700" : priorityTone === "amber" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}
        >
          {order.priority}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {order.product} • {order.customer}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>{order.qty} pcs</span>
        <span>Due {order.due}</span>
      </div>
    </button>
  );
}

export function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: { id: string; title: string; machine: string; shift: string; qty: string; hours: string; status: string; note: string };
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200 hover:bg-gray-50"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">{plan.title}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${plan.status === "Running" ? "bg-emerald-50 text-emerald-700" : plan.status === "Conflict" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}
        >
          {plan.status}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {plan.machine} • {plan.shift}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>{plan.qty}</span>
        <span>{plan.hours} hrs</span>
      </div>
      <p className="mt-2 text-[11px] text-gray-500">{plan.note}</p>
    </button>
  );
}

export function SchedulerTimeline({
  items,
  selectedId,
  onSelect,
  slots,
}: {
  items: { id: string; machine: string; title: string; status: string; start: number; duration: number }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  slots: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-180 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="grid grid-cols-[100px_repeat(7,minmax(90px,1fr))] gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
          <div>Machine</div>
          {slots.map((slot) => (
            <div key={slot} className="text-center">
              {slot}
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {items.map((machine) => {
            const machinePlans = items.filter((item) => item.machine === machine.machine);
            return (
              <div key={machine.machine} className="grid grid-cols-[100px_repeat(7,minmax(90px,1fr))] gap-2 items-center">
                <div className="text-sm font-semibold text-gray-700">{machine.machine}</div>
                <div className="col-span-7 relative h-16 rounded-lg border border-gray-200 bg-white">
                  {machinePlans.map((item) => {
                    const left = `${(item.start / slots.length) * 100}%`;
                    const width = `${(item.duration / slots.length) * 100}%`;
                    const isSelected = selectedId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={`absolute top-2 bottom-2 rounded-lg border px-2 py-1 text-left text-[11px] shadow-sm transition ${item.status === "Conflict" ? "border-red-200 bg-red-50 text-red-700" : item.status === "Running" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"} ${isSelected ? "ring-2 ring-blue-400" : ""}`}
                        style={{ left, width }}
                      >
                        <div className="truncate font-semibold">{item.title}</div>
                        <div className="truncate text-[10px] opacity-80">{item.id}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CapacityWidget({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: "blue" | "green" | "amber" | "red" }) {
  const toneStyles = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-emerald-500 to-green-500",
    amber: "from-amber-500 to-orange-500",
    red: "from-red-500 to-rose-500",
  } as const;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`h-1.5 rounded-full bg-linear-to-r ${toneStyles[tone]}`} />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </div>
  );
}

export function SimulationPanel({ scenario, metrics }: { scenario: string; metrics: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{scenario}</p>
          <p className="text-xs text-gray-500">Scenario comparison for the next planning horizon.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">Compare</div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">{metric.label}</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanDetailsDrawer({
  plan,
  detail,
}: {
  plan: { title: string; machine: string; order: string; status: string; shift: string; qty: string; hours: string; note: string };
  detail: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{plan.title}</p>
          <p className="mt-1 text-xs text-gray-500">
            {plan.machine} • {plan.order}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${plan.status === "Running" ? "bg-emerald-50 text-emerald-700" : plan.status === "Conflict" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}
        >
          {plan.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {detail.map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-100 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-700">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3 text-sm text-gray-600">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 size={14} />
          <span>Shift {plan.shift}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">{plan.note}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
          Save
        </button>
        <button type="button" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
          Reschedule
        </button>
        <button type="button" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          Delete
        </button>
      </div>
    </div>
  );
}

export function TrendChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  return (
    <div className="h-56 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((entry) => ({ name: entry.label, value: entry.value }))}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.16} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LoadChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-56 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.map((entry) => ({ name: entry.label, value: entry.value }))}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OeeChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-56 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((entry) => ({ name: entry.label, value: entry.value }))}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
