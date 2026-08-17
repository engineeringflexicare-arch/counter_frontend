"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Plus, Pencil, Trash2, X, Loader2, Cpu, AlertTriangle, Search, ChevronRight } from "lucide-react";

interface LineRecord {
  _id?: string;
  lineId: string;
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
  lineId: string;
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
  lineId: "",
  machineId: "",
  productCode: "",
  dailyTarget: "",
  hourlyTarget: "",
  teamMembers: "",
  shift: "Day",
  supervisor: "",
  shiftStartTime: "",
  shiftEndTime: "",
  floor: "Assembly Floor",
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

export default function ManageLinesPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  // ✅ Use /api/lines/ instead of /api/esp32/lines
  const LINES_API = `${API_BASE_URL}/api/lines`;

  const [lines, setLines] = useState<LineRecord[]>([]);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<LineRecord | null>(null);
  const [removing, setRemoving] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ FIX: Move data fetching directly into useEffect to avoid setState-in-effect warning
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const fetchLines = async () => {
      try {
        setLoading(true);
        // ✅ Use /api/lines/
        const res = await api.get(LINES_API, getHeaders());
        if (isMounted && res.data?.success && res.data?.data) {
          const arr = Object.values(res.data.data) as LineRecord[];
          setLines(arr.sort((a, b) => a.lineId.localeCompare(b.lineId)));
        }
      } catch (error) {
        if (isMounted) {
          showToast("error", "Failed to load lines.");
        }
        console.error("Failed to load lines:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLines();

    return () => {
      isMounted = false;
    };
  }, [LINES_API]);

  const fetchMachines = async () => {
    try {
      // ✅ Use /api/esp32/machines/free to get available machines
      const res = await api.get(`${API_BASE_URL}/api/esp32/machines/free`, getHeaders());
      if (res.data?.success && Array.isArray(res.data.data)) {
        setMachines(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch machines:", error);
    }
  };

  const openAssignModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    fetchMachines();
    setModalMode("assign");
  };

  const openEditModal = (line: LineRecord) => {
    setForm({
      lineId: line.lineId,
      machineId: line.machineId || "",
      productCode: line.productCode || "",
      dailyTarget: line.dailyTarget ? String(line.dailyTarget) : "",
      hourlyTarget: line.hourlyTarget ? String(line.hourlyTarget) : "",
      teamMembers: line.plannedMembers ? String(line.plannedMembers) : "",
      shift: line.shift || "Day",
      supervisor: line.supervisor || "",
      shiftStartTime: line.shiftStartTime || "",
      shiftEndTime: line.shiftEndTime || "",
      floor: line.floor || "Assembly Floor",
      plannedDate: line.plannedDate || "",
    });
    setFormError(null);
    fetchMachines();
    setModalMode("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setFormError(null);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.lineId.trim()) {
      setFormError("Line ID is required.");
      return;
    }
    if (modalMode === "assign" && !form.machineId.trim()) {
      setFormError("Machine ID is required to assign a line.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      lineId: form.lineId.trim(),
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
        // ✅ Use /api/lines/assign
        await api.post(`${LINES_API}/assign`, payload, getHeaders());
        showToast("success", `${payload.lineId} assigned to ${payload.machineId}.`);
      } else {
        // ✅ Use /api/lines/update
        await api.put(`${LINES_API}/update`, payload, getHeaders());
        showToast("success", `${payload.lineId} updated.`);
      }
      setModalMode(null);
      // Refresh lines
      const res = await api.get(LINES_API, getHeaders());
      if (res.data?.success && res.data?.data) {
        const arr = Object.values(res.data.data) as LineRecord[];
        setLines(arr.sort((a, b) => a.lineId.localeCompare(b.lineId)));
      }
    } catch (error) {
      showToast(error instanceof Error ? "error" : "error", "Failed to update line.");
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      // ✅ Use /api/lines/remove
      await api.delete(`${LINES_API}/remove`, {
        data: { lineId: removeTarget.lineId },
        ...getHeaders(),
      });
      showToast("success", `${removeTarget.lineId} assignment removed.`);
      setRemoveTarget(null);
      // Refresh lines
      const res = await api.get(LINES_API, getHeaders());
      if (res.data?.success && res.data?.data) {
        const arr = Object.values(res.data.data) as LineRecord[];
        setLines(arr.sort((a, b) => a.lineId.localeCompare(b.lineId)));
      }
    } catch (error) {
      showToast("error", "Failed to remove assignment.");
      console.error("Error removing assignment:", error);
    } finally {
      setRemoving(false);
    }
  };

  const filteredLines = lines.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [l.lineId, l.machineId, l.productCode, l.supervisor, l.floor].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const machineOptions = (() => {
    const set = new Map<string, string>();
    machines.forEach((m) => set.set(m.machineId, m.machineId));
    if (form.machineId) set.set(form.machineId, form.machineId);
    return Array.from(set.values());
  })();

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-800">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/Supervisor/assembly-floor")}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Floor
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-teal-50 p-1.5">
                <Cpu className="h-4 w-4 text-teal-600" />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Assembly Floor</p>
                <h1 className="text-sm font-bold text-slate-800 sm:text-base">Lines Management</h1>
              </div>
            </div>
          </div>

          <button
            onClick={openAssignModal}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-200 transition hover:bg-teal-500"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Assign Line</span>
            <span className="sm:hidden">Assign</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Stats strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Lines", value: lines.length },
            {
              label: "Assigned",
              value: lines.filter((l) => l.machineId).length,
            },
            {
              label: "Day Shift",
              value: lines.filter((l) => l.shift === "Day").length,
            },
            {
              label: "Night Shift",
              value: lines.filter((l) => l.shift === "Night").length,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by line, machine, product, supervisor, floor…"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : filteredLines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="rounded-full bg-slate-100 p-4">
                <Cpu className="h-6 w-6 text-slate-400" />
              </span>
              <p className="text-sm font-medium text-slate-500">No lines found</p>
              <p className="text-xs text-slate-400">{search ? "Try a different search term." : "Assign your first line to get started."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Line</th>
                    <th className="px-5 py-3">Machine</th>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Daily Target</th>
                    <th className="px-5 py-3">Shift</th>
                    <th className="px-5 py-3">Supervisor</th>
                    <th className="px-5 py-3">Floor</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLines.map((line) => (
                    <tr key={line.lineId} className="group transition hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-bold text-slate-800">{line.lineId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {line.machineId ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-xs font-medium text-teal-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                            {line.machineId}
                          </span>
                        ) : (
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{line.productCode || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5 font-mono text-sm tabular-nums text-slate-700">{line.dailyTarget ? line.dailyTarget.toLocaleString() : <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        {line.shift ? (
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${shiftColors[line.shift] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>{line.shift}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{line.supervisor || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{line.floor || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => openEditModal(line)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => setRemoveTarget(line)}
                            disabled={!line.machineId}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-right text-xs text-slate-400">
          {filteredLines.length} of {lines.length} lines
        </p>
      </main>

      {/* Assign / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-lg bg-teal-50 p-1.5">
                  <Cpu className="h-4 w-4 text-teal-600" />
                </span>
                <h2 className="text-sm font-bold text-slate-800">{modalMode === "assign" ? "Assign New Line" : `Edit ${form.lineId}`}</h2>
              </div>
              <button onClick={closeModal} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
              <Field label="Line ID" required>
                <input
                  type="text"
                  value={form.lineId}
                  disabled={modalMode === "edit"}
                  onChange={(e) => handleChange("lineId", e.target.value)}
                  placeholder="Line_01"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>

              <Field label="Machine" required={modalMode === "assign"}>
                <select
                  value={form.machineId}
                  onChange={(e) => handleChange("machineId", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">{modalMode === "edit" ? "Unassigned" : "Select machine…"}</option>
                  {machineOptions.map((m) => (
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
                  placeholder="032-000-1235"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Floor">
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                  placeholder="Assembly Floor"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Daily Target">
                <input
                  type="number"
                  value={form.dailyTarget}
                  onChange={(e) => handleChange("dailyTarget", e.target.value)}
                  placeholder="2880"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Hourly Target">
                <input
                  type="number"
                  value={form.hourlyTarget}
                  onChange={(e) => handleChange("hourlyTarget", e.target.value)}
                  placeholder="410"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Team Members">
                <input
                  type="number"
                  value={form.teamMembers}
                  onChange={(e) => handleChange("teamMembers", e.target.value)}
                  placeholder="8"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Supervisor">
                <input
                  type="text"
                  value={form.supervisor}
                  onChange={(e) => handleChange("supervisor", e.target.value)}
                  placeholder="Hashini"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Shift">
                <select
                  value={form.shift}
                  onChange={(e) => handleChange("shift", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                >
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </Field>

              <Field label="Planned Date">
                <input
                  type="date"
                  value={form.plannedDate}
                  onChange={(e) => handleChange("plannedDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Shift Start">
                <input
                  type="time"
                  value={form.shiftStartTime}
                  onChange={(e) => handleChange("shiftStartTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </Field>

              <Field label="Shift End">
                <input
                  type="time"
                  value={form.shiftEndTime}
                  onChange={(e) => handleChange("shiftEndTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
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
              <button onClick={closeModal} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-100 transition hover:bg-teal-500 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {modalMode === "assign" ? "Assign" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
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
              This clears the machine, product, target, and team details for <span className="font-mono font-bold text-slate-800">{removeTarget.lineId}</span>. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
              >
                {removing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "border-teal-200 bg-white text-teal-700 shadow-teal-100" : "border-red-200 bg-white text-red-600 shadow-red-100"
          }`}
        >
          {toast.type === "success" ? <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }): React.ReactElement {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
