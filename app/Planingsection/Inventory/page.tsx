"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Package, AlertTriangle, Plus, CheckCircle, Search, Archive, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  _id: string;
  item_code: string;
  item_name: string;
  category: string;
  available_qty: number;
  reorder_level: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Poly Bag", "Carton", "Label", "Connector", "Raw Material"];

const CATEGORY_STYLES: Record<string, string> = {
  "Poly Bag": "bg-violet-50 text-violet-700 border border-violet-200",
  Carton: "bg-sky-50 text-sky-700 border border-sky-200",
  Label: "bg-teal-50 text-teal-700 border border-teal-200",
  Connector: "bg-amber-50 text-amber-700 border border-amber-200",
  "Raw Material": "bg-rose-50 text-rose-700 border border-rose-200",
};

const DEFAULT_FORM = {
  item_code: "",
  item_name: "",
  category: "Poly Bag",
  available_qty: "",
  reorder_level: "1000",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  border,
  accent,
  valueColor,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  border: string;
  accent: string;
  valueColor?: string;
  pulse?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${border} px-6 py-5 flex items-center justify-between hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-1 leading-none ${valueColor ?? "text-gray-800"}`}>{value}</p>
      </div>
      <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon size={20} className={`${accent} ${pulse ? "animate-pulse" : ""}`} />
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
  "w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all";

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] ?? "bg-gray-100 text-gray-600 border border-gray-200";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>{category}</span>;
}

function StockBadge({ isShortage }: { isShortage: boolean }) {
  return isShortage ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
      <AlertTriangle size={11} />
      Shortage
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      <CheckCircle size={11} />
      In Stock
    </span>
  );
}

function EmptyState({ searched }: { searched: boolean }) {
  return (
    <tr>
      <td colSpan={5} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            {searched ? <Search size={24} className="text-gray-300" /> : <Archive size={24} className="text-gray-300" />}
          </div>
          <p className="text-sm font-medium text-gray-400">{searched ? "No items match your search" : "No inventory items yet"}</p>
          <p className="text-xs text-gray-300">{searched ? "Try a different item code or name." : "Add your first item using the form on the left."}</p>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/inventory");
      setItems(response.data.data || []);
      setError("");
    } catch {
      setError("Failed to load inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) await fetchInventory();
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchInventory]);

  // ── Derived Data ───────────────────────────────────────────────────────────

  const shortageCount = useMemo(() => items.filter((i) => i.available_qty <= i.reorder_level).length, [items]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => item.item_code.toLowerCase().includes(q) || item.item_name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
  }, [items, searchTerm]);

  // ── Form Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/v1/inventory", {
        ...formData,
        available_qty: Number(formData.available_qty),
        reorder_level: Number(formData.reorder_level),
      });
      setFormData((p) => ({
        ...DEFAULT_FORM,
        category: p.category,
        reorder_level: p.reorder_level,
      }));
      await fetchInventory();
    } catch {
      alert("Failed to add item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
              <Archive size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Inventory &amp; Packaging</h1>
              <p className="text-xs text-gray-400">Poly bags, cartons &amp; raw material stock</p>
            </div>
          </div>
          <button onClick={fetchInventory} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Total Items" value={items.length} icon={Package} border="border-blue-400" accent="text-blue-500" />
          <MetricCard label="Healthy Stock" value={items.length - shortageCount} icon={CheckCircle} border="border-emerald-400" accent="text-emerald-500" />
          <MetricCard
            label="Shortage Alerts"
            value={shortageCount}
            icon={AlertTriangle}
            border="border-red-400"
            accent={shortageCount > 0 ? "text-red-500" : "text-gray-300"}
            valueColor={shortageCount > 0 ? "text-red-600" : undefined}
            pulse={shortageCount > 0}
          />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* ── Form Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-purple-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Add New Item</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Item Code">
                <input
                  type="text"
                  placeholder="e.g. PB-001"
                  className={`${inputCls} uppercase`}
                  value={formData.item_code}
                  onChange={(e) => setFormData((p) => ({ ...p, item_code: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Item Name">
                <input
                  type="text"
                  placeholder="e.g. Poly Bag 10x12"
                  className={inputCls}
                  value={formData.item_name}
                  onChange={(e) => setFormData((p) => ({ ...p, item_name: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Category">
                <select className={inputCls} value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Initial Qty">
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className={inputCls}
                    value={formData.available_qty}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        available_qty: e.target.value,
                      }))
                    }
                    required
                  />
                </Field>
                <Field label="Reorder Level">
                  <input
                    type="number"
                    min={0}
                    className={`${inputCls} bg-amber-50 border-amber-200 focus:ring-amber-400`}
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        reorder_level: e.target.value,
                      }))
                    }
                    required
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Add to Inventory
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Table Panel ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <Package size={16} className="text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Stock Overview</h2>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by code, name or category…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <span className="text-xs text-gray-400 font-medium shrink-0">
                {filteredItems.length} / {items.length}
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <RefreshCw size={22} className="text-gray-300 animate-spin" />
                <p className="text-sm text-gray-400">Loading inventory…</p>
              </div>
            ) : error ? (
              <div className="m-6 bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} className="shrink-0" />
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Code", "Item Name", "Category", "Qty / Reorder", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredItems.length === 0 ? (
                      <EmptyState searched={searchTerm.trim().length > 0} />
                    ) : (
                      filteredItems.map((item) => {
                        const isShortage = item.available_qty <= item.reorder_level;
                        return (
                          <tr key={item._id} className={`hover:bg-slate-50/70 transition-colors ${isShortage ? "bg-red-50/30" : ""}`}>
                            {/* Code */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-bold text-gray-700 tracking-wide">{item.item_code}</span>
                            </td>

                            {/* Name */}
                            <td className="px-4 py-3 text-gray-700 font-medium">{item.item_name}</td>

                            {/* Category */}
                            <td className="px-4 py-3">
                              <CategoryBadge category={item.category} />
                            </td>

                            {/* Qty / Reorder */}
                            <td className="px-4 py-3">
                              <span className={`font-bold text-sm ${isShortage ? "text-red-600" : "text-emerald-600"}`}>{item.available_qty.toLocaleString()}</span>
                              <span className="text-xs text-gray-400 ml-1.5">/ {item.reorder_level.toLocaleString()}</span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <StockBadge isShortage={isShortage} />
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
