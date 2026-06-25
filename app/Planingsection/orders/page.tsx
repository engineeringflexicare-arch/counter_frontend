"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Factory, Plus, Trash2, List, Calendar, PackageSearch, CheckCircle, Clock, RefreshCw, AlertCircle, ShoppingCart } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  _id?: string;
  product_code: string;
  qty: number;
}

interface Order {
  _id: string;
  po_no: string;
  customer: string;
  due_date: string;
  status: string;
  order_items: OrderItem[];
}

type OrderStatus = "Pending" | "In Progress" | "Completed";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  po_no: "",
  customer: "Flexicare Sri Lanka",
  due_date: "",
};

const DEFAULT_ITEM: OrderItem = { product_code: "", qty: 0 };

const STATUS_OPTIONS: OrderStatus[] = ["Pending", "In Progress", "Completed"];

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { badge: string; select: string; metric: string; icon: React.ElementType; accent: string }> = {
  Pending: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    select: "bg-amber-50 text-amber-700",
    metric: "border-amber-400",
    icon: Clock,
    accent: "text-amber-500",
  },
  "In Progress": {
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    select: "bg-blue-50 text-blue-700",
    metric: "border-blue-400",
    icon: PackageSearch,
    accent: "text-blue-500",
  },
  Completed: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    select: "bg-emerald-50 text-emerald-700",
    metric: "border-emerald-400",
    icon: CheckCircle,
    accent: "text-emerald-500",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ status, count }: { status: OrderStatus; count: number }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${cfg.metric} px-6 py-5 flex items-center justify-between hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{status}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1 leading-none">{count}</p>
      </div>
      <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon size={20} className={cfg.accent} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all";

function EmptyState() {
  return (
    <tr>
      <td colSpan={5} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingCart size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No orders yet</p>
          <p className="text-xs text-gray-300">Create a new order using the form on the left.</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ ...DEFAULT_ITEM }]);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/orders");
      setOrders(response.data.data || []);
      setError("");
    } catch {
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) await fetchOrders();
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchOrders]);

  // ── Derived Metrics ────────────────────────────────────────────────────────

  const counts: Record<OrderStatus, number> = {
    Pending: orders.filter((o) => o.status === "Pending").length,
    "In Progress": orders.filter((o) => o.status === "In Progress").length,
    Completed: orders.filter((o) => o.status === "Completed").length,
  };

  // ── Item Handlers ──────────────────────────────────────────────────────────

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    setOrderItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItemRow = () => setOrderItems((prev) => [...prev, { ...DEFAULT_ITEM }]);

  const removeItemRow = (index: number) => {
    if (orderItems.length > 1) setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Form Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = orderItems.filter((item) => item.product_code.trim() !== "" && Number(item.qty) > 0);

    if (validItems.length === 0) {
      alert("Please add at least one valid product with a quantity.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/v1/orders", {
        ...formData,
        order_items: validItems,
      });

      setFormData(DEFAULT_FORM);
      setOrderItems([{ ...DEFAULT_ITEM }]);
      await fetchOrders();
    } catch {
      alert("Failed to save order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch {
      alert("Failed to delete order. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Status Update ──────────────────────────────────────────────────────────

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/v1/orders/${id}`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o)));
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
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Factory size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Order Management</h1>
              <p className="text-xs text-gray-400">Purchase orders &amp; shipping schedule</p>
            </div>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_OPTIONS.map((s) => (
            <MetricCard key={s} status={s} count={counts[s]} />
          ))}
        </div>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* ── Form Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">New Order</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="PO Number">
                  <input
                    type="text"
                    placeholder="0006-25"
                    className={`${inputCls} uppercase`}
                    value={formData.po_no}
                    onChange={(e) => setFormData((p) => ({ ...p, po_no: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Due Date">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="date" className={`${inputCls} pl-8`} value={formData.due_date} onChange={(e) => setFormData((p) => ({ ...p, due_date: e.target.value }))} required />
                  </div>
                </Field>
              </div>

              <Field label="Customer">
                <input type="text" className={inputCls} value={formData.customer} onChange={(e) => setFormData((p) => ({ ...p, customer: e.target.value }))} required />
              </Field>

              {/* ── Order Items ── */}
              <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Items</p>

                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Product code"
                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
                        value={item.product_code}
                        onChange={(e) => handleItemChange(index, "product_code", e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        className="w-20 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                        value={item.qty || ""}
                        onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={orderItems.length === 1}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addItemRow} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                  <Plus size={13} />
                  Add item
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Save Order
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Table Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={16} className="text-indigo-600" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Orders</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <RefreshCw size={22} className="text-gray-300 animate-spin" />
                <p className="text-sm text-gray-400">Loading orders…</p>
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
                      {["PO Number", "Items", "Due Date", "Status", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap last:text-right">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                      <EmptyState />
                    ) : (
                      orders.map((order) => {
                        const totalQty = order.order_items.reduce((sum, item) => sum + item.qty, 0);
                        const cfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG["Pending"];

                        return (
                          <tr key={order._id} className="hover:bg-slate-50/70 transition-colors group">
                            {/* PO + Customer */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="font-bold text-gray-800 text-sm">{order.po_no}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{order.customer}</p>
                            </td>

                            {/* Items */}
                            <td className="px-4 py-3 min-w-45">
                              <div className="space-y-0.5 max-h-20 overflow-y-auto pr-1">
                                {order.order_items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                                    <span className="font-mono">{item.product_code}</span>
                                    <span className="font-semibold ml-3 shrink-0">{item.qty} pcs</span>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs font-bold text-indigo-600 mt-1.5 pt-1 border-t border-gray-100">Total: {totalQty.toLocaleString()} pcs</div>
                            </td>

                            {/* Due Date */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Calendar size={13} className="text-gray-400 shrink-0" />
                                {order.due_date}
                              </div>
                            </td>

                            {/* Status Select */}
                            <td className="px-4 py-3">
                              <div className="relative">
                                <select
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer outline-none border-0 appearance-none pr-6 ${cfg.select} ${updatingId === order._id ? "opacity-50" : ""}`}
                                  value={order.status}
                                  onChange={(e) => updateStatus(order._id, e.target.value)}
                                  disabled={updatingId === order._id}
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>

                            {/* Delete */}
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDelete(order._id)}
                                disabled={deletingId === order._id}
                                title="Delete order"
                                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40"
                              >
                                {deletingId === order._id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
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
