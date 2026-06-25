"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Factory,
  RefreshCw,
  Calendar,
  ShoppingCart,
  Settings,
  Archive,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  PlayCircle,
  ArrowRight,
  Package,
  Target,
  Zap,
  BarChart3,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  _id: string;
  date: string;
  line_id: string;
  product_code: string;
  target_qty: number;
  planned_hours: number;
  status: string;
}

interface Order {
  _id: string;
  po_no: string;
  customer: string;
  due_date: string;
  status: string;
  order_items: { product_code: string; qty: number }[];
}

interface InjectionPlan {
  _id: string;
  machine_id: string;
  date: string;
  planned_qty: number;
  actual_qty: number;
  status: string;
  remarks: string;
}

interface InventoryItem {
  _id: string;
  item_code: string;
  item_name: string;
  category: string;
  available_qty: number;
  reorder_level: number;
}

interface DashboardData {
  plans: Plan[];
  orders: Order[];
  machines: InjectionPlan[];
  inventory: InventoryItem[];
}

// ─── Nav Links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/Planingsection", label: "Production Planning", icon: Calendar, color: "bg-blue-600" },
  { href: "/Ordersection", label: "Orders", icon: ShoppingCart, color: "bg-indigo-600" },
  { href: "/Machinesection", label: "Machine Planning", icon: Settings, color: "bg-orange-600" },
  { href: "/Inventorysection", label: "Inventory", icon: Archive, color: "bg-purple-600" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return Math.min(Math.round((a / b) * 100), 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, accent, href, children, loading }: { title: string; icon: React.ElementType; accent: string; href: string; children: React.ReactNode; loading: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${accent} flex items-center justify-center`}>
            <Icon size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <Link href={href} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          View all <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex-1 p-5">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <RefreshCw size={18} className="text-gray-200 animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: { up: boolean; text: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{trend.text}</span>}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniProgressBar({ value, color = "bg-blue-500" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color =
    s === "running" || s === "active" || s === "completed" || s === "in progress"
      ? "bg-emerald-400"
      : s === "pending"
        ? "bg-amber-400"
        : s === "maintenance" || s === "cancelled"
          ? "bg-red-400"
          : "bg-gray-300";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-8 text-center text-xs text-gray-300">
        {message}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MainDashboard() {
  const [data, setData] = useState<DashboardData>({
    plans: [],
    orders: [],
    machines: [],
    inventory: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, ordersRes, machinesRes, inventoryRes] = await Promise.allSettled([
        api.get("/api/v1/production-plans"),
        api.get("/api/v1/orders"),
        api.get("/api/v1/injection-plans"),
        api.get("/api/v1/inventory"),
      ]);

      setData({
        plans: plansRes.status === "fulfilled" ? plansRes.value.data.data || [] : [],
        orders: ordersRes.status === "fulfilled" ? ordersRes.value.data.data || [] : [],
        machines: machinesRes.status === "fulfilled" ? machinesRes.value.data.data || [] : [],
        inventory: inventoryRes.status === "fulfilled" ? inventoryRes.value.data.data || [] : [],
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) await fetchAll();
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  // ── Derived KPIs ───────────────────────────────────────────────────────────

  const { plans, orders, machines, inventory } = data;

  const totalTarget = plans.reduce((s, p) => s + p.target_qty, 0);
  const activePlans = plans.filter((p) => p.status?.toLowerCase() === "active").length;

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const inProgressOrders = orders.filter((o) => o.status === "In Progress").length;
  const completedOrders = orders.filter((o) => o.status === "Completed").length;
  const orderCompletion = pct(completedOrders, orders.length);

  const runningMachines = machines.filter((m) => m.status === "Running").length;
  const totalMachinePlanned = machines.reduce((s, m) => s + m.planned_qty, 0);
  const totalMachineActual = machines.reduce((s, m) => s + m.actual_qty, 0);
  const machineEfficiency = pct(totalMachineActual, totalMachinePlanned);

  const shortages = inventory.filter((i) => i.available_qty <= i.reorder_level);
  const healthyStock = inventory.length - shortages.length;
  const stockHealth = pct(healthyStock, inventory.length);

  // ── Recent records (latest 5) ──────────────────────────────────────────────
  const recentPlans = [...plans].slice(-5).reverse();
  const recentOrders = [...orders].slice(-5).reverse();
  const recentMachines = [...machines].slice(-5).reverse();
  const criticalStock = [...shortages].slice(0, 5);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Header ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
              <Factory size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Flexi Counter — Production Hub</h1>
              <p className="text-xs text-gray-400">{lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Nav quick-links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon, color }) => (
                <Link key={href} href={href} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-4 h-4 rounded ${color} flex items-center justify-center`}>
                    <Icon size={9} className="text-white" />
                  </div>
                  {label}
                </Link>
              ))}
            </nav>

            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Production Plans" value={plans.length} sub={`${activePlans} active · ${totalTarget.toLocaleString()} units`} icon={Target} color="bg-blue-500" />
          <KpiCard
            label="Open Orders"
            value={pendingOrders + inProgressOrders}
            sub={`${completedOrders} completed · ${orderCompletion}% done`}
            icon={ShoppingCart}
            color="bg-indigo-500"
            trend={completedOrders > 0 ? { up: true, text: `${orderCompletion}% ✓` } : undefined}
          />
          <KpiCard
            label="Machines Running"
            value={`${runningMachines} / ${machines.length}`}
            sub={`${machineEfficiency}% efficiency`}
            icon={Zap}
            color="bg-orange-500"
            trend={{ up: machineEfficiency >= 70, text: `${machineEfficiency}%` }}
          />
          <KpiCard
            label="Stock Alerts"
            value={shortages.length}
            sub={`${stockHealth}% healthy · ${inventory.length} items`}
            icon={AlertTriangle}
            color={shortages.length > 0 ? "bg-red-500" : "bg-emerald-500"}
            trend={shortages.length > 0 ? { up: false, text: `${shortages.length} low` } : { up: true, text: "All good" }}
          />
        </div>

        {/* ── Progress Overview ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Performance Overview</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Order Completion</span>
                <span className="text-xs font-bold text-gray-700">{orderCompletion}%</span>
              </div>
              <MiniProgressBar value={orderCompletion} color={orderCompletion >= 70 ? "bg-emerald-500" : orderCompletion >= 40 ? "bg-amber-500" : "bg-red-400"} />
              <div className="flex gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Pending {pendingOrders}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                  In Progress {inProgressOrders}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Done {completedOrders}
                </span>
              </div>
            </div>

            {/* Machine Efficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Machine Output Efficiency</span>
                <span className="text-xs font-bold text-gray-700">{machineEfficiency}%</span>
              </div>
              <MiniProgressBar value={machineEfficiency} color={machineEfficiency >= 80 ? "bg-emerald-500" : machineEfficiency >= 50 ? "bg-blue-500" : "bg-amber-500"} />
              <div className="flex gap-3 text-xs text-gray-400">
                <span>Planned {totalMachinePlanned.toLocaleString()}</span>
                <span>·</span>
                <span>Actual {totalMachineActual.toLocaleString()}</span>
              </div>
            </div>

            {/* Stock Health */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Inventory Health</span>
                <span className="text-xs font-bold text-gray-700">{stockHealth}%</span>
              </div>
              <MiniProgressBar value={stockHealth} color={stockHealth >= 80 ? "bg-emerald-500" : stockHealth >= 60 ? "bg-amber-500" : "bg-red-500"} />
              <div className="flex gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Healthy {healthyStock}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  Shortage {shortages.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4-Panel Detail Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Production Plans ── */}
          <SectionCard title="Production Plans" icon={Calendar} accent="bg-blue-600" href="/Planingsection" loading={loading}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Date", "Line", "Product", "Target", ""].map((h) => (
                    <th key={h} className="pb-2 text-left font-semibold text-gray-300 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPlans.length === 0 ? (
                  <EmptyRow cols={5} message="No production plans" />
                ) : (
                  recentPlans.map((plan) => (
                    <tr key={plan._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 text-gray-500">{plan.date}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-blue-600">{plan.line_id.replace("_", " ")}</span>
                      </td>
                      <td className="py-2.5 font-mono text-gray-600">{plan.product_code}</td>
                      <td className="py-2.5 font-bold text-gray-800">{plan.target_qty.toLocaleString()}</td>
                      <td className="py-2.5">
                        <StatusDot status={plan.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Link href="/Planingsection" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Manage plans <ArrowRight size={12} />
            </Link>
          </SectionCard>

          {/* ── Orders ── */}
          <SectionCard title="Purchase Orders" icon={ShoppingCart} accent="bg-indigo-600" href="/Ordersection" loading={loading}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  {["PO No.", "Customer", "Due", "Status"].map((h) => (
                    <th key={h} className="pb-2 text-left font-semibold text-gray-300 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <EmptyRow cols={4} message="No orders yet" />
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 font-bold text-gray-800">{order.po_no}</td>
                      <td className="py-2.5 text-gray-500 max-w-25 truncate">{order.customer}</td>
                      <td className="py-2.5 text-gray-400">{order.due_date}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${
                            order.status === "Completed" ? "bg-emerald-50 text-emerald-600" : order.status === "In Progress" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <StatusDot status={order.status} />
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Link href="/Ordersection" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Manage orders <ArrowRight size={12} />
            </Link>
          </SectionCard>

          {/* ── Machine Status ── */}
          <SectionCard title="Injection Machines" icon={Settings} accent="bg-orange-600" href="/Machinesection" loading={loading}>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Machine", "Planned", "Actual", "Eff.", "Status"].map((h) => (
                    <th key={h} className="pb-2 text-left font-semibold text-gray-300 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentMachines.length === 0 ? (
                  <EmptyRow cols={5} message="No machine plans today" />
                ) : (
                  recentMachines.map((m) => {
                    const eff = pct(m.actual_qty, m.planned_qty);
                    return (
                      <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5">
                          <span className="font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{m.machine_id}</span>
                        </td>
                        <td className="py-2.5 text-gray-500">{m.planned_qty.toLocaleString()}</td>
                        <td className="py-2.5 font-bold text-blue-600">{m.actual_qty.toLocaleString()}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${eff >= 80 ? "bg-emerald-500" : eff >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${eff}%` }} />
                            </div>
                            <span className="text-gray-400">{eff}%</span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${
                              m.status === "Running"
                                ? "bg-emerald-50 text-emerald-600"
                                : m.status === "Completed"
                                  ? "bg-blue-50 text-blue-600"
                                  : m.status === "Maintenance"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {m.status === "Running" && <PlayCircle size={10} className="animate-pulse" />}
                            {m.status === "Completed" && <CheckCircle size={10} />}
                            {m.status === "Pending" && <Clock size={10} />}
                            {m.status === "Maintenance" && <Activity size={10} />}
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <Link href="/Machinesection" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors">
              Manage machines <ArrowRight size={12} />
            </Link>
          </SectionCard>

          {/* ── Inventory Alerts ── */}
          <SectionCard title="Inventory Alerts" icon={Archive} accent="bg-purple-600" href="/Inventorysection" loading={loading}>
            {criticalStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <CheckCircle size={28} className="text-emerald-300" />
                <p className="text-sm font-medium text-gray-400">All stock levels healthy</p>
                <p className="text-xs text-gray-300">{inventory.length} items tracked</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Code", "Item", "Qty", "Reorder"].map((h) => (
                      <th key={h} className="pb-2 text-left font-semibold text-gray-300 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {criticalStock.map((item) => (
                    <tr key={item._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-gray-700">{item.item_code}</td>
                      <td className="py-2.5 text-gray-600 max-w-30 truncate">{item.item_name}</td>
                      <td className="py-2.5 font-bold text-red-600">{item.available_qty.toLocaleString()}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct(item.available_qty, item.reorder_level)}%` }} />
                          </div>
                          <span className="text-gray-400">{item.reorder_level.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Link href="/Inventorysection" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
              {shortages.length > 0 ? `Resolve ${shortages.length} shortage${shortages.length > 1 ? "s" : ""}` : "View inventory"} <ArrowRight size={12} />
            </Link>
          </SectionCard>
        </div>

        {/* ── Module Quick Access ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {NAV_LINKS.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
              </div>
              <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between text-xs text-gray-300 pb-2">
          <span className="flex items-center gap-1.5">
            <TrendingUp size={12} />
            Flexi Counter — Production Management System
          </span>
          <span className="flex items-center gap-1.5">
            <Package size={12} />
            {plans.length + orders.length + machines.length + inventory.length} total records
          </span>
        </div>
      </div>
    </div>
  );
}
