/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Settings2,
  Search,
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  Layers,
  Clock,
  Zap,
  Package,
  ChevronRight,
  Filter,
  RotateCcw,
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MouldService {
  serviceType: string;
  serviceDate: string;
  serviceInterval: number | "";
  serviceDescription: string;
}

interface AdditionalDevices {
  hotWaterUnit: string;
  coldWaterUnit: string;
  oilCoolingUnit: string;
  steamCoolingUnit: string;
  hotRunners: string;
  hydraulicUnit: string;
  airLine: string;
}

interface Mould {
  _id?: string;
  mouldNumber: string;
  productCode: string;
  cavityCount: number | "";
  validatedMaterials: string;
  standardMaterial: string;
  isCrushMaterialAllowed: boolean;
  compatibleMachines: string[];
  additionalDevices: AdditionalDevices;
  description: string;
  cycleTime: number | "";
  standardCapacity: number | "";
  externalInputs: Record<string, string>;
  status: "Active" | "Maintenance" | "Inactive";
  mouldService: MouldService;
}

interface Machine {
  _id: string;
  machineCode: string;
  tonnage: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEVICE_OPTIONS = ["Not Required", "Required", "Optional"];

const initialFormState: Mould = {
  mouldNumber: "",
  productCode: "",
  cavityCount: "",
  validatedMaterials: "",
  standardMaterial: "",
  isCrushMaterialAllowed: false,
  compatibleMachines: [],
  additionalDevices: {
    hotWaterUnit: "Not Required",
    coldWaterUnit: "Not Required",
    oilCoolingUnit: "Not Required",
    steamCoolingUnit: "Not Required",
    hotRunners: "Not Required",
    hydraulicUnit: "Not Required",
    airLine: "Not Required",
  },
  description: "",
  cycleTime: "",
  standardCapacity: "",
  externalInputs: {},
  status: "Active",
  mouldService: {
    serviceType: "",
    serviceDate: new Date().toISOString().split("T")[0],
    serviceInterval: "",
    serviceDescription: "",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: Mould["status"] }) => {
  const map = {
    Active: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    },
    Maintenance: {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    },
    Inactive: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      cls: "bg-red-50 text-red-600 ring-1 ring-red-200",
    },
  };
  const { icon, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {icon}
      {status}
    </span>
  );
};

const FormField = ({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label} {required && <span className="text-blue-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition";

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition appearance-none";

// ─── Modal Sections ───────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "basic", label: "Basic Info", icon: <Package className="h-4 w-4" /> },
  { id: "materials", label: "Materials", icon: <Layers className="h-4 w-4" /> },
  { id: "devices", label: "Devices", icon: <Zap className="h-4 w-4" /> },
  { id: "service", label: "Service", icon: <Wrench className="h-4 w-4" /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MouldManagementPage() {
  const [moulds, setMoulds] = useState<Mould[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Mould>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Mould["status"]>("All");
  const [activeSection, setActiveSection] = useState("basic");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = "/api/v1";

  // Auto-dismiss toasts
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Close modal on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeModal();
  };

  const fetchMoulds = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/v1/moulds`);
      setMoulds(response.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load moulds. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await api.get(`api/v1/machines`);
      setMachines(response.data?.data || []);
    } catch {
      setMachines([
        { _id: "60d5ecb8b392d700153ee123", machineCode: "INJ-001", tonnage: 150 },
        { _id: "60d5ecb8b392d700153ee124", machineCode: "INJ-002", tonnage: 250 },
      ]);
    }
  };

  useEffect(() => {
    fetchMoulds();
    fetchMachines();
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.mouldNumber || !formData.productCode) {
      setError("Mould Number සහ Product Code අනිවාර්යයි.");
      return;
    }
    try {
      setIsSaving(true);
      const url = isEditing ? `${API_BASE_URL}/moulds/${formData._id}` : `${API_BASE_URL}/moulds`;
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.message || "Save failed");
      }
      setSuccess(isEditing ? "Mould updated successfully!" : "Mould created successfully!");
      closeModal();
      fetchMoulds();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/moulds/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setSuccess("Mould deleted successfully!");
      setDeleteId(null);
      fetchMoulds();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openModalForAdd = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setActiveSection("basic");
    setIsModalOpen(true);
  };

  const openModalForEdit = (mould: Mould) => {
    setFormData({
      ...mould,
      mouldService: {
        ...mould.mouldService,
        serviceDate: mould.mouldService?.serviceDate ? new Date(mould.mouldService.serviceDate).toISOString().split("T")[0] : "",
      },
    });
    setIsEditing(true);
    setActiveSection("basic");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  // ── Form helpers ──────────────────────────────────────────────────────────

  const setField = (path: string, value: unknown) => {
    setFormData((prev) => {
      const keys = path.split(".");
      if (keys.length === 1) return { ...prev, [path]: value } as Mould;
      if (keys.length === 2) {
        const [a, b] = keys;
        return {
          ...prev,
          [a]: { ...(prev[a as keyof Mould] as Record<string, unknown>), [b]: value },
        } as Mould;
      }
      return prev;
    });
  };

  const toggleMachine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      compatibleMachines: prev.compatibleMachines.includes(id) ? prev.compatibleMachines.filter((m) => m !== id) : [...prev.compatibleMachines, id],
    }));
  };

  // ── Filters ───────────────────────────────────────────────────────────────

  const filteredMoulds = moulds.filter((m) => {
    const matchSearch =
      m.mouldNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: moulds.length,
    active: moulds.filter((m) => m.status === "Active").length,
    maintenance: moulds.filter((m) => m.status === "Maintenance").length,
    inactive: moulds.filter((m) => m.status === "Inactive").length,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Mould Management</h1>
              <p className="text-xs text-slate-400">Manufacturing Execution System</p>
            </div>
          </div>
          <button
            onClick={openModalForAdd}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition shadow-sm shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            Add Mould
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Moulds", value: stats.total, color: "bg-slate-800 text-white", click: () => setStatusFilter("All") },
            { label: "Active", value: stats.active, color: "bg-emerald-500 text-white", click: () => setStatusFilter("Active") },
            { label: "Maintenance", value: stats.maintenance, color: "bg-amber-400 text-white", click: () => setStatusFilter("Maintenance") },
            { label: "Inactive", value: stats.inactive, color: "bg-red-500 text-white", click: () => setStatusFilter("Inactive") },
          ].map((s) => (
            <button key={s.label} onClick={s.click} className={`${s.color} rounded-xl p-4 text-left transition hover:opacity-90 active:scale-95 shadow-sm`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs opacity-80 mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>

        {/* ── Toast notifications ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* ── Search & filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by mould number, product code…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          {(searchTerm || statusFilter !== "All") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Result count */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{filteredMoulds.length === moulds.length ? `${moulds.length} moulds total` : `${filteredMoulds.length} of ${moulds.length} moulds`}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mould No.</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Code</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Cavities</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Material</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Cycle Time</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Loader2 className="animate-spin mx-auto h-6 w-6 text-blue-500" />
                      <p className="mt-2 text-sm text-slate-400">Loading moulds…</p>
                    </td>
                  </tr>
                ) : filteredMoulds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Settings2 className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No moulds found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredMoulds.map((mould) => (
                    <tr key={mould._id} className="hover:bg-slate-50/70 transition group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2 py-0.5 rounded">{mould.mouldNumber}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">{mould.productCode}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                        {mould.cavityCount !== "" ? (
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                            {mould.cavityCount}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{mould.standardMaterial || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell">
                        {mould.cycleTime !== "" ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {mould.cycleTime}s
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={mould.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => openModalForEdit(mould)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteId(mould._id!)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
      ══════════════════════════════════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Mould?</h3>
            <p className="text-sm text-slate-500 mt-1">මෙය undo කළ නොහැකිය. Mould record එක Inactive ලෙස mark කෙරේ.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ADD / EDIT MODAL (slide-in drawer)
      ══════════════════════════════════════════════ */}
      {isModalOpen && (
        <div ref={overlayRef} onClick={handleOverlayClick} className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">{isEditing ? "Edit Mould" : "Add New Mould"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{isEditing ? `Editing ${formData.mouldNumber}` : "සියලු required fields පුරවන්න"}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Section nav */}
            <div className="flex border-b border-slate-200 bg-white overflow-x-auto">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                    activeSection === s.id ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* ── BASIC INFO ── */}
              {activeSection === "basic" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Mould Number" required>
                      <input className={inputCls} placeholder="e.g. MD-001" value={formData.mouldNumber} onChange={(e) => setField("mouldNumber", e.target.value.toUpperCase())} />
                    </FormField>
                    <FormField label="Product Code" required>
                      <input className={inputCls} placeholder="e.g. PRD-XA10" value={formData.productCode} onChange={(e) => setField("productCode", e.target.value)} />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField label="Cavity Count">
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        placeholder="e.g. 4"
                        value={formData.cavityCount}
                        onChange={(e) => setField("cavityCount", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormField>
                    <FormField label="Cycle Time (s)">
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        placeholder="e.g. 30"
                        value={formData.cycleTime}
                        onChange={(e) => setField("cycleTime", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormField>
                    <FormField label="Std. Capacity">
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="units/shift"
                        value={formData.standardCapacity}
                        onChange={(e) => setField("standardCapacity", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormField>
                  </div>

                  <FormField label="Description">
                    <textarea rows={3} className={inputCls + " resize-none"} placeholder="Mould description…" value={formData.description} onChange={(e) => setField("description", e.target.value)} />
                  </FormField>

                  <FormField label="Status">
                    <div className="relative">
                      <select className={selectCls} value={formData.status} onChange={(e) => setField("status", e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </FormField>

                  <FormField label="Compatible Machines">
                    <div className="grid grid-cols-2 gap-2">
                      {machines.map((m) => {
                        const selected = formData.compatibleMachines.includes(m._id);
                        return (
                          <button
                            key={m._id}
                            type="button"
                            onClick={() => toggleMachine(m._id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
                              selected ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <span>{m.machineCode}</span>
                            <span className="text-xs opacity-60">{m.tonnage}T</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                </>
              )}

              {/* ── MATERIALS ── */}
              {activeSection === "materials" && (
                <>
                  <FormField label="Standard Material" required>
                    <input className={inputCls} placeholder="e.g. PP, ABS, HDPE" value={formData.standardMaterial} onChange={(e) => setField("standardMaterial", e.target.value)} />
                  </FormField>
                  <FormField label="Validated Materials" hint="Comma-separated list of all approved materials">
                    <textarea
                      rows={3}
                      className={inputCls + " resize-none"}
                      placeholder="PP, ABS, HDPE, LLDPE…"
                      value={formData.validatedMaterials}
                      onChange={(e) => setField("validatedMaterials", e.target.value)}
                    />
                  </FormField>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <input
                      type="checkbox"
                      id="crushAllowed"
                      checked={formData.isCrushMaterialAllowed}
                      onChange={(e) => setField("isCrushMaterialAllowed", e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="crushAllowed" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Crush Material Allowed
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">Recycled / regrind material usage is permitted</span>
                    </label>
                  </div>
                </>
              )}

              {/* ── DEVICES ── */}
              {activeSection === "devices" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">එක් එක් device සඳහා requirement level set කරන්න.</p>
                  {Object.entries(formData.additionalDevices).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-sm font-medium text-slate-700 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <div className="relative w-40">
                        <select value={val} onChange={(e) => setField(`additionalDevices.${key}`, e.target.value)} className={selectCls + " py-1.5 text-xs"}>
                          {DEVICE_OPTIONS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── SERVICE ── */}
              {activeSection === "service" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Service Type" required>
                      <input className={inputCls} placeholder="e.g. Preventive" value={formData.mouldService.serviceType} onChange={(e) => setField("mouldService.serviceType", e.target.value)} />
                    </FormField>
                    <FormField label="Service Interval (shots)" required>
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="e.g. 50000"
                        value={formData.mouldService.serviceInterval}
                        onChange={(e) => setField("mouldService.serviceInterval", e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormField>
                  </div>
                  <FormField label="Last Service Date" required>
                    <input type="date" className={inputCls} value={formData.mouldService.serviceDate} onChange={(e) => setField("mouldService.serviceDate", e.target.value)} />
                  </FormField>
                  <FormField label="Service Description" required>
                    <textarea
                      rows={4}
                      className={inputCls + " resize-none"}
                      placeholder="Service details…"
                      value={formData.mouldService.serviceDescription}
                      onChange={(e) => setField("mouldService.serviceDescription", e.target.value)}
                    />
                  </FormField>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between gap-3">
              {/* Section navigation arrows */}
              <div className="flex gap-2">
                {SECTIONS.map((s) => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)} className={`h-2 w-2 rounded-full transition ${activeSection === s.id ? "bg-blue-600 w-6" : "bg-slate-300"}`} />
                ))}
              </div>
              <div className="flex gap-3 ml-auto">
                {/* Next / Prev quick nav */}
                {(() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                  return idx < SECTIONS.length - 1 ? (
                    <button
                      onClick={() => setActiveSection(SECTIONS[idx + 1].id)}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : null;
                })()}
                <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center gap-2 shadow-sm shadow-blue-200"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEditing ? "Update Mould" : "Create Mould"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
