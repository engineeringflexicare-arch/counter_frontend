"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  RotateCcw,
  Zap,
  Gauge,
  MapPin,
  Thermometer,
  Activity,
  Settings,
  Package,
  BarChart2,
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type MachineStatus = "Active" | "Maintenance" | "Inactive" | "Idle";
type MachineType = "injection" | "extruder";

interface ServiceRecord {
  serviceType: string;
  serviceDate: string;
  serviceInterval: number | "";
  serviceDescription: string;
  nextServiceDate: string;
}

// ── Injection Moulding Machine ──
interface InjectionMachine {
  _id?: string;
  machineCode: string;
  machineName: string;
  manufacturer: string;
  modelNumber: string;
  yearOfManufacture: number | "";
  // Specs
  tonnage: number | "";
  shotWeight: number | ""; // grams
  screwDiameter: number | ""; // mm
  injectionPressure: number | ""; // bar
  clampingForce: number | ""; // kN
  maxMouldSize: string;
  minMouldSize: string;
  // Location
  location: string;
  floor: string;
  lineId: string;
  // Production stats
  totalShotCount: number | "";
  plannedCapacity: number | ""; // shots/hr
  actualCapacity: number | "";
  oeeTarget: number | ""; // %
  // Status
  status: MachineStatus;
  // Service
  machineService: ServiceRecord;
  notes: string;
}

// ── Extruder Machine ──
interface ExtruderMachine {
  _id?: string;
  machineCode: string;
  machineName: string;
  manufacturer: string;
  modelNumber: string;
  yearOfManufacture: number | "";
  // Specs
  screwDiameter: number | ""; // mm
  barrelLength: number | ""; // mm
  ldRatio: number | ""; // L/D ratio
  outputRate: number | ""; // kg/hr
  motorPower: number | ""; // kW
  maxTemperature: number | ""; // °C
  screw_type: string;
  // Location
  location: string;
  floor: string;
  lineId: string;
  // Production stats
  plannedOutput: number | ""; // kg/shift
  actualOutput: number | "";
  oeeTarget: number | "";
  // Status
  status: MachineStatus;
  // Service
  machineService: ServiceRecord;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: MachineStatus[] = ["Active", "Maintenance", "Inactive", "Idle"];

const initialService: ServiceRecord = {
  serviceType: "",
  serviceDate: new Date().toISOString().split("T")[0],
  serviceInterval: "",
  serviceDescription: "",
  nextServiceDate: "",
};

const initialInjection: InjectionMachine = {
  machineCode: "",
  machineName: "",
  manufacturer: "",
  modelNumber: "",
  yearOfManufacture: "",
  tonnage: "",
  shotWeight: "",
  screwDiameter: "",
  injectionPressure: "",
  clampingForce: "",
  maxMouldSize: "",
  minMouldSize: "",
  location: "",
  floor: "",
  lineId: "",
  totalShotCount: "",
  plannedCapacity: "",
  actualCapacity: "",
  oeeTarget: "",
  status: "Active",
  machineService: { ...initialService },
  notes: "",
};

const initialExtruder: ExtruderMachine = {
  machineCode: "",
  machineName: "",
  manufacturer: "",
  modelNumber: "",
  yearOfManufacture: "",
  screwDiameter: "",
  barrelLength: "",
  ldRatio: "",
  outputRate: "",
  motorPower: "",
  maxTemperature: "",
  screw_type: "",
  location: "",
  floor: "",
  lineId: "",
  plannedOutput: "",
  actualOutput: "",
  oeeTarget: "",
  status: "Active",
  machineService: { ...initialService },
  notes: "",
};

const INJECTION_SECTIONS = [
  { id: "basic", label: "Basic Info", icon: <Package className="h-4 w-4" /> },
  { id: "specs", label: "Specs", icon: <Gauge className="h-4 w-4" /> },
  { id: "location", label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { id: "stats", label: "Production", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "service", label: "Service", icon: <Wrench className="h-4 w-4" /> },
];

const EXTRUDER_SECTIONS = [
  { id: "basic", label: "Basic Info", icon: <Package className="h-4 w-4" /> },
  { id: "specs", label: "Specs", icon: <Thermometer className="h-4 w-4" /> },
  { id: "location", label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { id: "stats", label: "Production", icon: <Activity className="h-4 w-4" /> },
  { id: "service", label: "Service", icon: <Wrench className="h-4 w-4" /> },
];

// ─── Shared UI Components ─────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: MachineStatus }) => {
  const map: Record<MachineStatus, { icon: React.ReactNode; cls: string }> = {
    Active: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    Maintenance: { icon: <AlertTriangle className="h-3.5 w-3.5" />, cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    Inactive: { icon: <XCircle className="h-3.5 w-3.5" />, cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
    Idle: { icon: <Activity className="h-3.5 w-3.5" />, cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  };
  const { icon, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {icon}
      {status}
    </span>
  );
};

const FormField = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
      {required && <span className="text-blue-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition";
const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition appearance-none";

const NumField = ({
  label,
  placeholder,
  value,
  onChange,
  unit,
  required,
  hint,
}: {
  label: string;
  placeholder?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  unit?: string;
  required?: boolean;
  hint?: string;
}) => (
  <FormField label={label} required={required} hint={hint}>
    <div className="relative">
      <input
        type="number"
        min={0}
        className={inputCls + (unit ? " pr-12" : "")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
      {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">{unit}</span>}
    </div>
  </FormField>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MachineManagementPage() {
  const [activeTab, setActiveTab] = useState<MachineType>("injection");

  // Injection state
  const [injMachines, setInjMachines] = useState<InjectionMachine[]>([]);
  const [injLoading, setInjLoading] = useState(true);
  const [injForm, setInjForm] = useState<InjectionMachine>(initialInjection);
  const [injEditing, setInjEditing] = useState(false);
  const [injModalOpen, setInjModalOpen] = useState(false);
  const [injSection, setInjSection] = useState("basic");

  // Extruder state
  const [extMachines, setExtMachines] = useState<ExtruderMachine[]>([]);
  const [extLoading, setExtLoading] = useState(true);
  const [extForm, setExtForm] = useState<ExtruderMachine>(initialExtruder);
  const [extEditing, setExtEditing] = useState(false);
  const [extModalOpen, setExtModalOpen] = useState(false);
  const [extSection, setExtSection] = useState("basic");

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: MachineType } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | MachineStatus>("All");

  const overlayRef = useRef<HTMLDivElement>(null);

  // Toast auto-dismiss
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

  // Reset search when switching tabs — done in the handler, not an effect

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchInjection = useCallback(async () => {
    try {
      setInjLoading(true);
      const res = await api.get("/api/v1/machines/injection");
      setInjMachines(res.data?.data || []);
    } catch {
      setInjMachines([]);
    } finally {
      setInjLoading(false);
    }
  }, []);

  const fetchExtruder = useCallback(async () => {
    try {
      setExtLoading(true);
      const res = await api.get("/api/v1/machines/extruder");
      setExtMachines(res.data?.data || []);
    } catch {
      setExtMachines([]);
    } finally {
      setExtLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInjection();
    fetchExtruder();
  }, [fetchInjection, fetchExtruder]);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const isInj = activeTab === "injection";
    const form = isInj ? injForm : extForm;
    if (!form.machineCode) {
      setError("Machine Code අනිවාර්යයි.");
      return;
    }

    try {
      setIsSaving(true);
      const base = `/api/v1/machines/${activeTab}`;
      const isEdit = isInj ? injEditing : extEditing;
      const id = (form as InjectionMachine | ExtruderMachine)._id;

      if (isEdit && id) {
        await api.put(`${base}/${id}`, form);
      } else {
        await api.post(base, form);
      }

      setSuccess(isEdit ? "Machine updated!" : "Machine created!");
      if (isInj) {
        setInjModalOpen(false);
        fetchInjection();
      } else {
        setExtModalOpen(false);
        fetchExtruder();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    try {
      await api.delete(`/api/v1/machines/${type}/${id}`);
      setSuccess("Machine deleted.");
      setDeleteTarget(null);
      if (type === "injection") fetchInjection();
      else fetchExtruder();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAdd = (type: MachineType) => {
    if (type === "injection") {
      setInjForm(initialInjection);
      setInjEditing(false);
      setInjSection("basic");
      setInjModalOpen(true);
    } else {
      setExtForm(initialExtruder);
      setExtEditing(false);
      setExtSection("basic");
      setExtModalOpen(true);
    }
  };

  const openEdit = (machine: InjectionMachine | ExtruderMachine, type: MachineType) => {
    const svc = machine.machineService;
    const fixed = {
      ...machine,
      machineService: {
        ...svc,
        serviceDate: svc?.serviceDate ? new Date(svc.serviceDate).toISOString().split("T")[0] : "",
        nextServiceDate: svc?.nextServiceDate ? new Date(svc.nextServiceDate).toISOString().split("T")[0] : "",
      },
    };
    if (type === "injection") {
      setInjForm(fixed as InjectionMachine);
      setInjEditing(true);
      setInjSection("basic");
      setInjModalOpen(true);
    } else {
      setExtForm(fixed as ExtruderMachine);
      setExtEditing(true);
      setExtSection("basic");
      setExtModalOpen(true);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent, close: () => void) => {
    if (e.target === overlayRef.current) close();
  };

  // ── Generic deep field setter ──────────────────────────────────────────────

  const setInjField = (path: string, value: unknown) => {
    setInjForm((prev) => deepSet(prev, path, value) as InjectionMachine);
  };
  const setExtField = (path: string, value: unknown) => {
    setExtForm((prev) => deepSet(prev, path, value) as ExtruderMachine);
  };

  function deepSet<T>(obj: T, path: string, value: unknown): T {
    const keys = path.split(".");
    if (keys.length === 1) return { ...obj, [path]: value };
    const [head, ...rest] = keys;
    return {
      ...obj,
      [head]: deepSet((obj as Record<string, unknown>)[head] as Record<string, unknown>, rest.join("."), value),
    };
  }

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = (list: (InjectionMachine | ExtruderMachine)[]) =>
    list.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchQ = m.machineCode.toLowerCase().includes(q) || m.machineName.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
      const matchS = statusFilter === "All" || m.status === statusFilter;
      return matchQ && matchS;
    });

  const stats = (list: (InjectionMachine | ExtruderMachine)[]) => ({
    total: list.length,
    active: list.filter((m) => m.status === "Active").length,
    maintenance: list.filter((m) => m.status === "Maintenance").length,
    idle: list.filter((m) => m.status === "Idle").length,
  });

  const curList = activeTab === "injection" ? injMachines : extMachines;
  const curLoading = activeTab === "injection" ? injLoading : extLoading;
  const s = stats(curList);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Machine Management</h1>
              <p className="text-xs text-slate-400">Manufacturing Execution System</p>
            </div>
          </div>
          <button
            onClick={() => openAdd(activeTab)}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition shadow-sm shadow-indigo-200"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === "injection" ? "Injection Machine" : "Extruder"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* ── Machine type tabs ── */}
        <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
          {(["injection", "extruder"] as MachineType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setSearchTerm("");
                setStatusFilter("All");
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === t ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "injection" ? <Zap className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
              {t === "injection" ? "Injection Moulding" : "Extruder"}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === t ? "bg-indigo-100 text-indigo-700" : "bg-slate-300 text-slate-600"}`}>
                {t === "injection" ? injMachines.length : extMachines.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: s.total, color: "bg-slate-800 text-white", f: "All" as const },
            { label: "Active", value: s.active, color: "bg-emerald-500 text-white", f: "Active" as const },
            { label: "Maintenance", value: s.maintenance, color: "bg-amber-400 text-white", f: "Maintenance" as const },
            { label: "Idle", value: s.idle, color: "bg-slate-400 text-white", f: "Idle" as const },
          ].map((card) => (
            <button key={card.label} onClick={() => setStatusFilter(card.f)} className={`${card.color} rounded-xl p-4 text-left hover:opacity-90 active:scale-95 transition shadow-sm`}>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs opacity-80 mt-0.5">{card.label}</div>
            </button>
          ))}
        </div>

        {/* ── Toasts ── */}
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

        {/* ── Search & filter ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search by code, name, location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
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
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition appearance-none"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
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
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100">
            <span className="text-xs text-slate-500">{filtered(curList).length === curList.length ? `${curList.length} machines` : `${filtered(curList).length} of ${curList.length} machines`}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Machine Code</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Name</th>
                  {activeTab === "injection" ? (
                    <>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Tonnage</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Shot Weight</th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Output Rate</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Screw Ø</th>
                    </>
                  )}
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {curLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Loader2 className="animate-spin mx-auto h-6 w-6 text-indigo-500" />
                      <p className="mt-2 text-sm text-slate-400">Loading machines…</p>
                    </td>
                  </tr>
                ) : filtered(curList).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Settings className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No machines found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : activeTab === "injection" ? (
                  (filtered(injMachines) as InjectionMachine[]).map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm">{m.machineCode}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium hidden sm:table-cell">{m.machineName || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{m.tonnage !== "" ? `${m.tonnage} T` : "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell">{m.shotWeight !== "" ? `${m.shotWeight} g` : "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{m.location || "—"}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => openEdit(m, "injection")} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: m._id!, type: "injection" })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  (filtered(extMachines) as ExtruderMachine[]).map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm">{m.machineCode}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium hidden sm:table-cell">{m.machineName || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{m.outputRate !== "" ? `${m.outputRate} kg/hr` : "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell">{m.screwDiameter !== "" ? `${m.screwDiameter} mm` : "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{m.location || "—"}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => openEdit(m, "extruder")} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: m._id!, type: "extruder" })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition" title="Delete">
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
          DELETE DIALOG
      ══════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Machine?</h3>
            <p className="text-sm text-slate-500 mt-1">මෙය undo කළ නොහැකිය. Machine record එක Inactive ලෙස mark කෙරේ.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          INJECTION MACHINE MODAL
      ══════════════════════════════════════════════ */}
      {injModalOpen && (
        <div ref={overlayRef} onClick={(e) => handleOverlayClick(e, () => setInjModalOpen(false))} className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-600" />
                  {injEditing ? "Edit Injection Machine" : "Add Injection Machine"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{injEditing ? `Editing ${injForm.machineCode}` : "සියලු required fields පුරවන්න"}</p>
              </div>
              <button onClick={() => setInjModalOpen(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Section tabs */}
            <div className="flex border-b border-slate-200 bg-white overflow-x-auto">
              {INJECTION_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setInjSection(s.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                    injSection === s.id ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Basic */}
              {injSection === "basic" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Machine Code" required>
                      <input className={inputCls} placeholder="e.g. INJ-001" value={injForm.machineCode} onChange={(e) => setInjField("machineCode", e.target.value.toUpperCase())} />
                    </FormField>
                    <FormField label="Machine Name">
                      <input className={inputCls} placeholder="e.g. Arburg 470C" value={injForm.machineName} onChange={(e) => setInjField("machineName", e.target.value)} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Manufacturer">
                      <input className={inputCls} placeholder="e.g. Arburg, Engel" value={injForm.manufacturer} onChange={(e) => setInjField("manufacturer", e.target.value)} />
                    </FormField>
                    <FormField label="Model Number">
                      <input className={inputCls} placeholder="Model" value={injForm.modelNumber} onChange={(e) => setInjField("modelNumber", e.target.value)} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Year of Manufacture" placeholder="e.g. 2018" value={injForm.yearOfManufacture} onChange={(v) => setInjField("yearOfManufacture", v)} />
                    <FormField label="Status">
                      <div className="relative">
                        <select className={selectCls} value={injForm.status} onChange={(e) => setInjField("status", e.target.value)}>
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </FormField>
                  </div>
                  <FormField label="Notes">
                    <textarea rows={3} className={inputCls + " resize-none"} placeholder="Additional notes…" value={injForm.notes} onChange={(e) => setInjField("notes", e.target.value)} />
                  </FormField>
                </>
              )}

              {/* Specs */}
              {injSection === "specs" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Clamping Force" placeholder="e.g. 1500" value={injForm.tonnage} unit="T" onChange={(v) => setInjField("tonnage", v)} hint="Metric tonnes" />
                    <NumField label="Shot Weight" placeholder="e.g. 250" value={injForm.shotWeight} unit="g" onChange={(v) => setInjField("shotWeight", v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Screw Diameter" placeholder="e.g. 50" value={injForm.screwDiameter} unit="mm" onChange={(v) => setInjField("screwDiameter", v)} />
                    <NumField label="Injection Pressure" placeholder="e.g. 2200" value={injForm.injectionPressure} unit="bar" onChange={(v) => setInjField("injectionPressure", v)} />
                  </div>
                  <NumField label="Clamping Force (kN)" placeholder="e.g. 6000" value={injForm.clampingForce} unit="kN" onChange={(v) => setInjField("clampingForce", v)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Max Mould Size" hint="W × H × D mm">
                      <input className={inputCls} placeholder="e.g. 600×500×400" value={injForm.maxMouldSize} onChange={(e) => setInjField("maxMouldSize", e.target.value)} />
                    </FormField>
                    <FormField label="Min Mould Size" hint="W × H × D mm">
                      <input className={inputCls} placeholder="e.g. 150×150×100" value={injForm.minMouldSize} onChange={(e) => setInjField("minMouldSize", e.target.value)} />
                    </FormField>
                  </div>
                </>
              )}

              {/* Location */}
              {injSection === "location" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Location" required>
                      <input className={inputCls} placeholder="e.g. Hall A" value={injForm.location} onChange={(e) => setInjField("location", e.target.value)} />
                    </FormField>
                    <FormField label="Floor">
                      <input className={inputCls} placeholder="e.g. Ground Floor" value={injForm.floor} onChange={(e) => setInjField("floor", e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Line ID" hint="Assigned production line">
                    <input className={inputCls} placeholder="e.g. LINE-03" value={injForm.lineId} onChange={(e) => setInjField("lineId", e.target.value)} />
                  </FormField>
                </>
              )}

              {/* Production */}
              {injSection === "stats" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Planned Capacity" placeholder="e.g. 120" value={injForm.plannedCapacity} unit="shots/hr" onChange={(v) => setInjField("plannedCapacity", v)} />
                    <NumField label="Actual Capacity" placeholder="e.g. 108" value={injForm.actualCapacity} unit="shots/hr" onChange={(v) => setInjField("actualCapacity", v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="OEE Target" placeholder="e.g. 85" value={injForm.oeeTarget} unit="%" onChange={(v) => setInjField("oeeTarget", v)} />
                    <NumField label="Total Shot Count" placeholder="Lifetime shots" value={injForm.totalShotCount} onChange={(v) => setInjField("totalShotCount", v)} />
                  </div>
                </>
              )}

              {/* Service */}
              {injSection === "service" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Service Type" required>
                      <input
                        className={inputCls}
                        placeholder="e.g. Preventive"
                        value={injForm.machineService.serviceType}
                        onChange={(e) => setInjField("machineService.serviceType", e.target.value)}
                      />
                    </FormField>
                    <NumField
                      label="Service Interval"
                      placeholder="e.g. 500"
                      unit="hrs"
                      value={injForm.machineService.serviceInterval}
                      onChange={(v) => setInjField("machineService.serviceInterval", v)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Last Service Date" required>
                      <input type="date" className={inputCls} value={injForm.machineService.serviceDate} onChange={(e) => setInjField("machineService.serviceDate", e.target.value)} />
                    </FormField>
                    <FormField label="Next Service Date">
                      <input type="date" className={inputCls} value={injForm.machineService.nextServiceDate} onChange={(e) => setInjField("machineService.nextServiceDate", e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Service Description" required>
                    <textarea
                      rows={4}
                      className={inputCls + " resize-none"}
                      placeholder="Service details…"
                      value={injForm.machineService.serviceDescription}
                      onChange={(e) => setInjField("machineService.serviceDescription", e.target.value)}
                    />
                  </FormField>
                </>
              )}
            </div>

            {/* Footer */}
            <ModalFooter
              sections={INJECTION_SECTIONS}
              activeSection={injSection}
              setSection={setInjSection}
              onCancel={() => setInjModalOpen(false)}
              onSave={handleSave}
              isSaving={isSaving}
              isEditing={injEditing}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          EXTRUDER MODAL
      ══════════════════════════════════════════════ */}
      {extModalOpen && (
        <div onClick={(e) => handleOverlayClick(e, () => setExtModalOpen(false))} className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-indigo-600" />
                  {extEditing ? "Edit Extruder" : "Add Extruder"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{extEditing ? `Editing ${extForm.machineCode}` : "සියලු required fields පුරවන්න"}</p>
              </div>
              <button onClick={() => setExtModalOpen(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Section tabs */}
            <div className="flex border-b border-slate-200 bg-white overflow-x-auto">
              {EXTRUDER_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setExtSection(s.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                    extSection === s.id ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Basic */}
              {extSection === "basic" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Machine Code" required>
                      <input className={inputCls} placeholder="e.g. EXT-001" value={extForm.machineCode} onChange={(e) => setExtField("machineCode", e.target.value.toUpperCase())} />
                    </FormField>
                    <FormField label="Machine Name">
                      <input className={inputCls} placeholder="e.g. Davis-Standard 90mm" value={extForm.machineName} onChange={(e) => setExtField("machineName", e.target.value)} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Manufacturer">
                      <input className={inputCls} placeholder="e.g. Davis-Standard" value={extForm.manufacturer} onChange={(e) => setExtField("manufacturer", e.target.value)} />
                    </FormField>
                    <FormField label="Model Number">
                      <input className={inputCls} placeholder="Model" value={extForm.modelNumber} onChange={(e) => setExtField("modelNumber", e.target.value)} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Year of Manufacture" placeholder="e.g. 2020" value={extForm.yearOfManufacture} onChange={(v) => setExtField("yearOfManufacture", v)} />
                    <FormField label="Status">
                      <div className="relative">
                        <select className={selectCls} value={extForm.status} onChange={(e) => setExtField("status", e.target.value)}>
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </FormField>
                  </div>
                  <FormField label="Notes">
                    <textarea rows={3} className={inputCls + " resize-none"} placeholder="Additional notes…" value={extForm.notes} onChange={(e) => setExtField("notes", e.target.value)} />
                  </FormField>
                </>
              )}

              {/* Specs */}
              {extSection === "specs" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Screw Diameter" placeholder="e.g. 90" value={extForm.screwDiameter} unit="mm" onChange={(v) => setExtField("screwDiameter", v)} />
                    <NumField label="Barrel Length" placeholder="e.g. 2700" value={extForm.barrelLength} unit="mm" onChange={(v) => setExtField("barrelLength", v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="L/D Ratio" placeholder="e.g. 30" value={extForm.ldRatio} onChange={(v) => setExtField("ldRatio", v)} hint="Barrel length / screw diameter" />
                    <NumField label="Output Rate" placeholder="e.g. 250" value={extForm.outputRate} unit="kg/hr" onChange={(v) => setExtField("outputRate", v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Motor Power" placeholder="e.g. 75" value={extForm.motorPower} unit="kW" onChange={(v) => setExtField("motorPower", v)} />
                    <NumField label="Max Temperature" placeholder="e.g. 350" value={extForm.maxTemperature} unit="°C" onChange={(v) => setExtField("maxTemperature", v)} />
                  </div>
                  <FormField label="Screw Type" hint="e.g. Single screw, Twin screw, Barrier">
                    <input className={inputCls} placeholder="e.g. Single Screw — General Purpose" value={extForm.screw_type} onChange={(e) => setExtField("screw_type", e.target.value)} />
                  </FormField>
                </>
              )}

              {/* Location */}
              {extSection === "location" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Location" required>
                      <input className={inputCls} placeholder="e.g. Hall B" value={extForm.location} onChange={(e) => setExtField("location", e.target.value)} />
                    </FormField>
                    <FormField label="Floor">
                      <input className={inputCls} placeholder="e.g. Ground Floor" value={extForm.floor} onChange={(e) => setExtField("floor", e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Line ID" hint="Assigned production line">
                    <input className={inputCls} placeholder="e.g. LINE-07" value={extForm.lineId} onChange={(e) => setExtField("lineId", e.target.value)} />
                  </FormField>
                </>
              )}

              {/* Production */}
              {extSection === "stats" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField label="Planned Output" placeholder="e.g. 1800" value={extForm.plannedOutput} unit="kg/shift" onChange={(v) => setExtField("plannedOutput", v)} />
                    <NumField label="Actual Output" placeholder="e.g. 1650" value={extForm.actualOutput} unit="kg/shift" onChange={(v) => setExtField("actualOutput", v)} />
                  </div>
                  <NumField label="OEE Target" placeholder="e.g. 85" value={extForm.oeeTarget} unit="%" onChange={(v) => setExtField("oeeTarget", v)} />
                </>
              )}

              {/* Service */}
              {extSection === "service" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Service Type" required>
                      <input
                        className={inputCls}
                        placeholder="e.g. Preventive"
                        value={extForm.machineService.serviceType}
                        onChange={(e) => setExtField("machineService.serviceType", e.target.value)}
                      />
                    </FormField>
                    <NumField
                      label="Service Interval"
                      placeholder="e.g. 2000"
                      unit="hrs"
                      value={extForm.machineService.serviceInterval}
                      onChange={(v) => setExtField("machineService.serviceInterval", v)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Last Service Date" required>
                      <input type="date" className={inputCls} value={extForm.machineService.serviceDate} onChange={(e) => setExtField("machineService.serviceDate", e.target.value)} />
                    </FormField>
                    <FormField label="Next Service Date">
                      <input type="date" className={inputCls} value={extForm.machineService.nextServiceDate} onChange={(e) => setExtField("machineService.nextServiceDate", e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Service Description" required>
                    <textarea
                      rows={4}
                      className={inputCls + " resize-none"}
                      placeholder="Service details…"
                      value={extForm.machineService.serviceDescription}
                      onChange={(e) => setExtField("machineService.serviceDescription", e.target.value)}
                    />
                  </FormField>
                </>
              )}
            </div>

            {/* Footer */}
            <ModalFooter
              sections={EXTRUDER_SECTIONS}
              activeSection={extSection}
              setSection={setExtSection}
              onCancel={() => setExtModalOpen(false)}
              onSave={handleSave}
              isSaving={isSaving}
              isEditing={extEditing}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal Footer (shared) ────────────────────────────────────────────────────

function ModalFooter({
  sections,
  activeSection,
  setSection,
  onCancel,
  onSave,
  isSaving,
  isEditing,
}: {
  sections: { id: string }[];
  activeSection: string;
  setSection: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isEditing: boolean;
}) {
  const idx = sections.findIndex((s) => s.id === activeSection);
  return (
    <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between gap-3">
      <div className="flex gap-2">
        {sections.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)} className={`h-2 rounded-full transition-all ${activeSection === s.id ? "bg-indigo-600 w-6" : "w-2 bg-slate-300"}`} />
        ))}
      </div>
      <div className="flex gap-3 ml-auto">
        {idx < sections.length - 1 && (
          <button
            onClick={() => setSection(sections[idx + 1].id)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center gap-2 shadow-sm shadow-indigo-200"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Update Machine" : "Create Machine"}
        </button>
      </div>
    </div>
  );
}
