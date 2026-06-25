"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Trash2, ListTodo, AlertCircle, RefreshCw, Factory, Clock, Target, TrendingUp } from "lucide-react";
import api from "@/lib/api";

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

interface FormData {
  date: string;
  line_id: string;
  product_code: string;
  target_qty: string;
  planned_hours: number;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-100",
  active: "bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-100",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
  cancelled: "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-100",
};

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "pending";
  const style = STATUS_STYLES[s] ?? STATUS_STYLES.pending;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>{s}</span>;
}

// ─── Line Badge ───────────────────────────────────────────────────────────────

const LINE_COLORS: Record<string, string> = {
  Line_01: "bg-violet-50 text-violet-700 border border-violet-200",
  Line_02: "bg-sky-50 text-sky-700 border border-sky-200",
  Line_03: "bg-teal-50 text-teal-700 border border-teal-200",
};

function LineBadge({ lineId }: { lineId: string }) {
  const style = LINE_COLORS[lineId] ?? "bg-gray-100 text-gray-600 border border-gray-200";
  const label = lineId.replace("_", " ");
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>{label}</span>;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`shrink-0 rounded-lg p-2.5 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase truncate">{label}</p>
        <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Form Input Wrapper ───────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all";

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={7} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <Factory size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No plans created yet</p>
          <p className="text-xs text-gray-300">Add a new production plan using the form on the left.</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_FORM: FormData = {
  date: new Date().toISOString().split("T")[0],
  line_id: "Line_01",
  product_code: "",
  target_qty: "",
  planned_hours: 8,
};

export default function ProductionPlanning() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [capacityMessage, setCapacityMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/production-plans");
      setPlans(response.data.data);
      setError("");
    } catch {
      setError("Failed to load production plans. Please try again.");
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

  const totalTarget = plans.reduce((sum, p) => sum + p.target_qty, 0);
  const totalHours = plans.reduce((sum, p) => sum + p.planned_hours, 0);
  const activePlans = plans.filter((p) => p.status?.toLowerCase() === "active").length;

  // ── Capacity Calculation ───────────────────────────────────────────────────

  const handleCalculateCapacity = useCallback(async () => {
    if (!formData.product_code.trim() || !formData.planned_hours) return;

    setCalculating(true);
    setCapacityMessage(null);

    try {
      const response = await api.post("api/v1/capacity-planning", {
        product_code: formData.product_code,
        working_minutes: formData.planned_hours * 60,
      });

      if (response.data.success) {
        const { estimated_capacity, product, message } = response.data.data;
        setFormData((prev) => ({
          ...prev,
          target_qty: estimated_capacity.toString(),
        }));
        setCapacityMessage({
          type: "success",
          text: `${product}: ${message}`,
        });
      }
    } catch {
      setCapacityMessage({
        type: "error",
        text: "Product code not found. Please verify and try again.",
      });
    } finally {
      setCalculating(false);
    }
  }, [formData.product_code, formData.planned_hours]);

  // ── Form Submission ────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("api/v1/production-plans", {
        ...formData,
        target_qty: Number(formData.target_qty),
        planned_hours: Number(formData.planned_hours),
      });

      setFormData((prev) => ({
        ...DEFAULT_FORM,
        date: prev.date,
        line_id: prev.line_id,
      }));
      setCapacityMessage(null);
      await fetchPlans();
    } catch {
      alert("Failed to save production plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Plan ────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this production plan?")) return;

    setDeletingId(id);
    try {
      await api.delete(`api/v1/production-plans/${id}`);
      setPlans((prev) => prev.filter((p) => p._id !== id));
    } catch {
      alert("Failed to delete plan. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Factory size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Production Planning</h1>
              <p className="text-xs text-gray-400">Daily schedule management</p>
            </div>
          </div>
          <button onClick={fetchPlans} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* ── Metrics Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={ListTodo} label="Total Plans" value={plans.length} sub="this period" color="bg-blue-500" />
          <MetricCard icon={TrendingUp} label="Active Plans" value={activePlans} sub="in progress" color="bg-violet-500" />
          <MetricCard icon={Target} label="Total Target" value={totalTarget.toLocaleString()} sub="units planned" color="bg-emerald-500" />
          <MetricCard icon={Clock} label="Total Hours" value={`${totalHours} h`} sub="allocated" color="bg-amber-500" />
        </div>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* ── Form Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">New Plan</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Date">
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="date" className={`${inputCls} pl-9`} value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} required />
                </div>
              </Field>

              <Field label="Production Line">
                <select className={inputCls} value={formData.line_id} onChange={(e) => setFormData((p) => ({ ...p, line_id: e.target.value }))}>
                  <option value="Line_01">Line 01</option>
                  <option value="Line_02">Line 02</option>
                  <option value="Line_03">Line 03</option>
                </select>
              </Field>

              <Field label="Product Code">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 038-61-304"
                    className={`${inputCls} flex-1`}
                    value={formData.product_code}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        product_code: e.target.value,
                      }))
                    }
                    onBlur={handleCalculateCapacity}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCalculateCapacity}
                    disabled={calculating}
                    title="Calculate capacity"
                    className="shrink-0 w-10 h-10.5 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={`text-gray-500 ${calculating ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Planned Hours">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    className={inputCls}
                    value={formData.planned_hours}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        planned_hours: Number(e.target.value),
                      }))
                    }
                    onBlur={handleCalculateCapacity}
                    required
                  />
                </Field>

                <Field label="Target Qty">
                  <input
                    type="number"
                    placeholder="Auto-calculated"
                    className={`${inputCls} bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold focus:ring-emerald-400`}
                    value={formData.target_qty}
                    onChange={(e) => setFormData((p) => ({ ...p, target_qty: e.target.value }))}
                    required
                  />
                </Field>
              </div>

              {capacityMessage && (
                <div
                  className={`text-xs px-3 py-2.5 rounded-lg flex items-start gap-2 ${
                    capacityMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">{capacityMessage.type === "success" ? "✓" : "✕"}</span>
                  <span>{capacityMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Save Production Plan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Table Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo size={16} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Current Plans</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {plans.length} record{plans.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <RefreshCw size={22} className="text-gray-300 animate-spin" />
                <p className="text-sm text-gray-400">Loading plans…</p>
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
                      {["Date", "Line", "Product Code", "Target Qty", "Hours", "Status", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap last:text-right">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {plans.length === 0 ? (
                      <EmptyState />
                    ) : (
                      plans.map((plan) => (
                        <tr key={plan._id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{plan.date}</td>
                          <td className="px-4 py-3">
                            <LineBadge lineId={plan.line_id} />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600 tracking-wide">{plan.product_code}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{plan.target_qty.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-500">{plan.planned_hours}h</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={plan.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(plan._id)}
                              disabled={deletingId === plan._id}
                              title="Delete plan"
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40"
                            >
                              {deletingId === plan._id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </td>
                        </tr>
                      ))
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
