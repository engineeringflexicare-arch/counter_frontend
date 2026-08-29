"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Plus, Pencil, Trash2, X, Loader2, Cpu, AlertTriangle, Search, ChevronRight, Clock } from "lucide-react";

interface InjectionRecord {
  _id?: string;
  injectionMachineNumber: string;
  mouldNumber?: string;
  cavities?: number;
  machineId?: string;
  productCode?: string;
  dailyTarget?: number;
  hourlyTarget?: number;
  plannedMembers?: number;
  totalProductCount?: number;
  shift?: string;
  supervisor?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  floor?: string;
  plannedDate?: string;
}

interface MachineOption {
  machineId: string;
}

interface FormState {
  injectionMachineNumber: string;
  mouldNumber: string;
  cavities: string;
  machineId: string;
  productCode: string;
  dailyTarget: string;
  hourlyTarget: string;
  teamMembers: string;
  shift: string;
  supervisor: string;
  shiftStartTime: string;
  shiftEndTime: string;
  floor: string;
  plannedDate: string;
}

const EMPTY_FORM: FormState = {
  injectionMachineNumber: "",
  mouldNumber: "",
  cavities: "",
  machineId: "",
  productCode: "",
  dailyTarget: "",
  hourlyTarget: "",
  teamMembers: "",
  shift: "Day",
  supervisor: "",
  shiftStartTime: "",
  shiftEndTime: "",
  floor: "Production Floor",
  plannedDate: "",
};

type ModalMode = "assign" | "edit" | null;

const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const getHeaders = () => {
  const token = getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const shiftColors: Record<string, string> = {
  Day: "bg-amber-50 text-amber-700 border-amber-200",
  Night: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const getRealTimeShift = (startTime?: string, endTime?: string, dbShift?: string, currentTime?: Date) => {
  if (!startTime || !endTime) return dbShift || "Day";

  const now = currentTime || new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startTime.split(":").map(Number);
  const startMins = startH * 60 + startM;

  const [endH, endM] = endTime.split(":").map(Number);
  const endMins = endH * 60 + endM;

  if (startMins < endMins) {
    if (currentMins >= startMins && currentMins < endMins) return "Day";
    return "Night";
  } else {
    if (currentMins >= startMins || currentMins < endMins) return "Night";
    return "Day";
  }
};

export default function ManageInjectionMachinesPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const API_ENDPOINT = `${API_BASE_URL}/api/injection-machines`;

  const [records, setRecords] = useState<InjectionRecord[]>([]);
  const [espDevices, setEspDevices] = useState<MachineOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [currentTime, setCurrentTime] = useState(new Date());

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<InjectionRecord | null>(null);
  const [removing, setRemoving] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await api.get(API_ENDPOINT, getHeaders());
        if (isMounted && res.data?.success && res.data?.data) {
          const arr = Object.values(res.data.data) as InjectionRecord[];
          setRecords(arr.sort((a, b) => a.injectionMachineNumber.localeCompare(b.injectionMachineNumber)));
        }
      } catch (error) {
        console.error("Failed to load records:", error);
        if (isMounted) showToast("error", "Failed to load records.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRecords();
    return () => {
      isMounted = false;
    };
  }, [API_ENDPOINT]);

  const fetchEspDevices = async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/api/esp32/machines/free`, getHeaders());
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEspDevices(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch ESP devices:", error);
    }
  };

  const openAssignModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    fetchEspDevices();
    setModalMode("assign");
  };

  const openEditModal = (record: InjectionRecord) => {
    setForm({
      injectionMachineNumber: record.injectionMachineNumber,
      mouldNumber: record.mouldNumber || "",
      cavities: record.cavities ? String(record.cavities) : "",
      machineId: record.machineId || "",
      productCode: record.productCode || "",
      dailyTarget: record.dailyTarget ? String(record.dailyTarget) : "",
      hourlyTarget: record.hourlyTarget ? String(record.hourlyTarget) : "",
      teamMembers: record.plannedMembers ? String(record.plannedMembers) : "",
      shift: record.shift || "Day",
      supervisor: record.supervisor || "",
      shiftStartTime: record.shiftStartTime || "",
      shiftEndTime: record.shiftEndTime || "",
      floor: record.floor || "Production Floor",
      plannedDate: record.plannedDate || "",
    });
    setFormError(null);
    fetchEspDevices();
    setModalMode("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setFormError(null);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "shiftStartTime" && value) {
        const hour = parseInt(value.split(":")[0], 10);
        if (hour >= 6 && hour < 18) {
          updated.shift = "Day";
        } else {
          updated.shift = "Night";
        }
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!form.injectionMachineNumber.trim()) {
      setFormError("Machine Number is required.");
      return;
    }
    if (!form.mouldNumber.trim()) {
      setFormError("Mould Number is required.");
      return;
    }
    if (modalMode === "assign" && !form.machineId.trim()) {
      setFormError("ESP32 Device ID is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      injectionMachineNumber: form.injectionMachineNumber.trim(),
      mouldNumber: form.mouldNumber.trim(),
      cavities: Number(form.cavities) || 1,
      machineId: form.machineId.trim(),
      productCode: form.productCode.trim(),
      dailyTarget: Number(form.dailyTarget) || 0,
      hourlyTarget: Number(form.hourlyTarget) || 0,
      teamMembers: Number(form.teamMembers) || 0,
      shift: form.shift,
      supervisor: form.supervisor.trim(),
      shiftStartTime: form.shiftStartTime,
      shiftEndTime: form.shiftEndTime,
      floor: form.floor.trim(),
      plannedDate: form.plannedDate,
    };

    try {
      if (modalMode === "assign") {
        await api.post(`${API_ENDPOINT}/assign`, payload, getHeaders());
        showToast("success", `${payload.injectionMachineNumber} assigned successfully.`);
      } else {
        await api.put(`${API_ENDPOINT}/update`, payload, getHeaders());
        showToast("success", `${payload.injectionMachineNumber} updated.`);
      }
      setModalMode(null);

      const res = await api.get(API_ENDPOINT, getHeaders());
      if (res.data?.success && res.data?.data) {
        const arr = Object.values(res.data.data) as InjectionRecord[];
        setRecords(arr.sort((a, b) => a.injectionMachineNumber.localeCompare(b.injectionMachineNumber)));
      }
    } catch (error) {
      console.error("Error updating record:", error);
      showToast("error", "Failed to update record.");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`${API_ENDPOINT}/remove`, { data: { injectionMachineNumber: removeTarget.injectionMachineNumber }, ...getHeaders() });
      showToast("success", "Assignment removed.");
      setRemoveTarget(null);
      const res = await api.get(API_ENDPOINT, getHeaders());
      if (res.data?.success && res.data?.data) {
        const arr = Object.values(res.data.data) as InjectionRecord[];
        setRecords(arr.sort((a, b) => a.injectionMachineNumber.localeCompare(b.injectionMachineNumber)));
      }
    } catch (error) {
      console.error("Error removing assignment:", error);
      showToast("error", "Failed to remove assignment.");
    } finally {
      setRemoving(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.injectionMachineNumber, r.mouldNumber, r.machineId, r.productCode, r.supervisor, r.floor].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const espOptions = (() => {
    const set = new Map<string, string>();
    espDevices.forEach((m) => set.set(m.machineId, m.machineId));
    if (form.machineId) set.set(form.machineId, form.machineId);
    return Array.from(set.values());
  })();

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/Supervisor/production-floor")}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Floor
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-teal-50 p-1.5">
                <Cpu className="h-4 w-4 text-teal-600" />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Production Floor</p>
                <h1 className="text-sm font-bold text-slate-800 sm:text-base">Molding Machines Management</h1>
              </div>
            </div>
          </div>
          <button
            onClick={openAssignModal}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-500"
          >
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Assign Machine</span> <span className="sm:hidden">Assign</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Machines", value: records.length },
            { label: "Assigned ESPs", value: records.filter((r) => r.machineId).length },
            { label: "Currently Day Shift", value: records.filter((r) => getRealTimeShift(r.shiftStartTime, r.shiftEndTime, r.shift, currentTime) === "Day").length },
            { label: "Currently Night Shift", value: records.filter((r) => getRealTimeShift(r.shiftStartTime, r.shiftEndTime, r.shift, currentTime) === "Night").length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by machine number, mould, product, supervisor…"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="rounded-full bg-slate-100 p-4">
                <Cpu className="h-6 w-6 text-slate-400" />
              </span>
              <p className="text-sm font-medium text-slate-500">No machines found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Machine No</th>
                    <th className="px-5 py-3">Mould No</th>
                    <th className="px-5 py-3">ESP32 Device</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Active Shift</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => {
                    const activeShift = getRealTimeShift(record.shiftStartTime, record.shiftEndTime, record.shift, currentTime);
                    return (
                      <tr key={record.injectionMachineNumber} className="group transition hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-bold text-slate-800">{record.injectionMachineNumber}</span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{record.mouldNumber || "—"}</td>
                        <td className="px-5 py-3.5">
                          {record.machineId ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-xs font-medium text-teal-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                              {record.machineId}
                            </span>
                          ) : (
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{record.productCode || "—"}</td>
                        <td className="px-5 py-3.5 font-mono text-sm tabular-nums text-slate-700">{record.dailyTarget ? record.dailyTarget.toLocaleString() : "—"}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${shiftColors[activeShift] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}
                          >
                            <Clock className="h-3 w-3" />
                            {activeShift}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {record.shiftStartTime} - {record.shiftEndTime}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => openEditModal(record)}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => setRemoveTarget(record)}
                              disabled={!record.machineId}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Assign / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-bold text-slate-800">{modalMode === "assign" ? "Assign New Machine" : `Edit ${form.injectionMachineNumber}`}</h2>
              <button onClick={closeModal} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 📋 Updated Form Grid with all requested fields */}
            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
              <Field label="Machine Number" required>
                <input
                  type="text"
                  value={form.injectionMachineNumber}
                  disabled={modalMode === "edit"}
                  onChange={(e) => handleChange("injectionMachineNumber", e.target.value)}
                  placeholder="INJ_01"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Mould Number" required>
                <input
                  type="text"
                  value={form.mouldNumber}
                  onChange={(e) => handleChange("mouldNumber", e.target.value)}
                  placeholder="MLD-01"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Cavities (Parts per shot)" required>
                <input
                  type="number"
                  value={form.cavities}
                  onChange={(e) => handleChange("cavities", e.target.value)}
                  placeholder="4"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="ESP32 Device ID" required={modalMode === "assign"}>
                <select
                  value={form.machineId}
                  onChange={(e) => handleChange("machineId", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                >
                  <option value="">{modalMode === "edit" ? "Unassigned" : "Select ESP32…"}</option>
                  {espOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Product Code">
                <input
                  type="text"
                  value={form.productCode}
                  onChange={(e) => handleChange("productCode", e.target.value)}
                  placeholder="PROD-001"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Floor">
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                  placeholder="Production Floor"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Daily Target (Total Parts)">
                <input
                  type="number"
                  value={form.dailyTarget}
                  onChange={(e) => handleChange("dailyTarget", e.target.value)}
                  placeholder="2880"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Hourly Target (Parts)">
                <input
                  type="number"
                  value={form.hourlyTarget}
                  onChange={(e) => handleChange("hourlyTarget", e.target.value)}
                  placeholder="240"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Team Members">
                <input
                  type="number"
                  value={form.teamMembers}
                  onChange={(e) => handleChange("teamMembers", e.target.value)}
                  placeholder="3"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Supervisor">
                <input
                  type="text"
                  value={form.supervisor}
                  onChange={(e) => handleChange("supervisor", e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Shift Start">
                <input
                  type="time"
                  value={form.shiftStartTime}
                  onChange={(e) => handleChange("shiftStartTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Shift End">
                <input
                  type="time"
                  value={form.shiftEndTime}
                  onChange={(e) => handleChange("shiftEndTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>

              <Field label="Shift (Auto Calculated / Manual)">
                <select value={form.shift} onChange={(e) => handleChange("shift", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none">
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </Field>

              <Field label="Planned Date">
                <input
                  type="date"
                  value={form.plannedDate}
                  onChange={(e) => handleChange("plannedDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
                />
              </Field>
            </div>

            {formError && (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {formError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {modalMode === "assign" ? "Assign" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Assignment Confirmation Modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => !removing && setRemoveTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="rounded-full bg-red-50 p-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </span>
              <h2 className="text-sm font-bold text-slate-800">Remove Assignment</h2>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-slate-500">
              This clears the ESP32 device, product, target, mould and team details for <span className="font-mono font-bold text-slate-800">{removeTarget.injectionMachineNumber}</span>. This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setRemoveTarget(null)} disabled={removing} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60"
              >
                {removing && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "border-teal-200 bg-white text-teal-700 shadow-teal-100" : "border-red-200 bg-white text-red-600 shadow-red-100"}`}
        >
          {toast.type === "success" ? <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
