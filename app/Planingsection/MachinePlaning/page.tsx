"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Settings, Plus, Activity, AlertCircle, PlayCircle, CheckCircle, Wrench, RefreshCw, Calendar, Factory } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InjectionPlan {
  _id: string;
  machine_id: string;
  date: string;
  planned_qty: number;
  actual_qty: number;
  status: string;
  remarks: string;
}

type MachineStatus = "Pending" | "Running" | "Completed" | "Maintenance";

// ─── Constants ────────────────────────────────────────────────────────────────

const MACHINES = Array.from({ length: 16 }, (_, i) => `INJ-${String(i + 1).padStart(2, "0")}`);

const DEFAULT_FORM = {
  date: new Date().toISOString().split("T")[0],
  machine_id: "INJ-02",
  planned_qty: "",
  remarks: "",
};

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  MachineStatus,
  {
    badge: string;
    icon: React.ElementType;
    pulse?: boolean;
    nextStatus?: MachineStatus;
    actionLabel?: string;
    actionCls?: string;
  }
> = {
  Pending: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: AlertCircle,
    nextStatus: "Running",
    actionLabel: "Start Machine",
    actionCls: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
  },
  Running: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: PlayCircle,
    pulse: true,
    nextStatus: "Completed",
    actionLabel: "Mark Done",
    actionCls: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
  },
  Completed: {
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: CheckCircle,
  },
  Maintenance: {
    badge: "bg-red-50 text-red-700 border border-red-200",
    icon: Wrench,
  },
};

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, accent, border }: { label: string; value: number; icon: React.ElementType; accent: string; border: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${border} px-6 py-5 flex items-center justify-between hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1 leading-none">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon size={20} className={accent} />
      </div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status as MachineStatus;
  const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.Pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge} ${cfg.pulse ? "animate-pulse" : ""}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ actual, planned }: { actual: number; planned: number }) {
  const pct = planned > 0 ? Math.min(Math.round((actual / planned) * 100), 100) : 0;
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 30 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="flex items-center gap-2 min-w-25">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 shrink-0 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={6} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <Settings size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No machines assigned yet</p>
          <p className="text-xs text-gray-300">Assign a target using the form on the left.</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MachinePlanningDashboard() {
  const [plans, setPlans] = useState<InjectionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/injection-plans");
      setPlans(response.data.data || []);
      setError("");
    } catch {
      setError("Failed to load machine plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) await fetchPlans();
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPlans]);

  // ── Derived Metrics ────────────────────────────────────────────────────────

  const totalPlans = plans.length;
  const runningCount = plans.filter((p) => p.status === "Running").length;
  const pendingCount = plans.filter((p) => p.status === "Pending").length;

  // ── Form Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/v1/injection-plans", {
        ...formData,
        planned_qty: Number(formData.planned_qty),
      });
      setFormData((p) => ({ ...p, planned_qty: "", remarks: "" }));
      await fetchPlans();
    } catch {
      alert("Failed to save machine plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status Update ──────────────────────────────────────────────────────────

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/v1/injection-plans/${id}`, { status: newStatus });
      setPlans((prev) => prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p)));
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center">
              <Factory size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Injection Machine Planning</h1>
              <p className="text-xs text-gray-400">Daily RB machine targets &amp; status board</p>
            </div>
          </div>
          <button onClick={fetchPlans} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Total Assigned" value={totalPlans} icon={Activity} accent="text-blue-500" border="border-blue-400" />
          <MetricCard label="Running Now" value={runningCount} icon={PlayCircle} accent="text-emerald-500" border="border-emerald-400" />
          <MetricCard label="Pending Tasks" value={pendingCount} icon={AlertCircle} accent="text-amber-500" border="border-amber-400" />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* ── Form Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-orange-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Assign Target</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Date">
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="date" className={`${inputCls} pl-8`} value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} required />
                </div>
              </Field>

              <Field label="Machine Number">
                <select className={inputCls} value={formData.machine_id} onChange={(e) => setFormData((p) => ({ ...p, machine_id: e.target.value }))}>
                  {MACHINES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Planned Qty">
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 453"
                  className={inputCls}
                  value={formData.planned_qty}
                  onChange={(e) => setFormData((p) => ({ ...p, planned_qty: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Remarks (optional)">
                <input
                  type="text"
                  placeholder="e.g. Maintenance needed after run"
                  className={inputCls}
                  value={formData.remarks}
                  onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Assign to Machine
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Table Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-orange-600" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Machine Status Board</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {plans.length} machine{plans.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <RefreshCw size={22} className="text-gray-300 animate-spin" />
                <p className="text-sm text-gray-400">Loading machine data…</p>
              </div>
            ) : error ? (
              <div className="m-6 bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Machine", "Date", "Planned", "Actual / Progress", "Status", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {plans.length === 0 ? (
                      <EmptyState />
                    ) : (
                      plans.map((plan) => {
                        const cfg = STATUS_CONFIG[plan.status as MachineStatus] ?? STATUS_CONFIG.Pending;
                        const isUpdating = updatingId === plan._id;

                        return (
                          <tr key={plan._id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Machine ID */}
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-900 text-white text-xs font-bold tracking-wider">{plan.machine_id}</span>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{plan.date}</td>

                            {/* Planned Qty */}
                            <td className="px-4 py-3 font-bold text-gray-800">{plan.planned_qty.toLocaleString()}</td>

                            {/* Actual + Progress */}
                            <td className="px-4 py-3">
                              <div className="space-y-1.5">
                                <span className="font-bold text-blue-600 text-sm">{plan.actual_qty.toLocaleString()}</span>
                                <ProgressBar actual={plan.actual_qty} planned={plan.planned_qty} />
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="px-4 py-3">
                              <StatusBadge status={plan.status} />
                              {plan.remarks && <p className="text-xs text-gray-400 mt-1 max-w-35 truncate">{plan.remarks}</p>}
                            </td>

                            {/* Quick Action */}
                            <td className="px-4 py-3">
                              {cfg.nextStatus && (
                                <button
                                  onClick={() => updateStatus(plan._id, cfg.nextStatus!)}
                                  disabled={isUpdating}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 flex items-center gap-1.5 ${cfg.actionCls}`}
                                >
                                  {isUpdating ? <RefreshCw size={11} className="animate-spin" /> : <PlayCircle size={11} />}
                                  {cfg.actionLabel}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
