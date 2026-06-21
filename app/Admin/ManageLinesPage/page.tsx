"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Plus, Pencil, Trash2, X, Loader2, Cpu, AlertTriangle, Search } from "lucide-react";

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

// ===== Auth helpers =====
// Module scope එකට ගත්තේ — මේවට component state/props මත depend වෙන්නේ නැති නිසා,
// component ඇතුළේ තිබුණොත් render එක හැමවිටම අලුත් function reference එකක් හදනවා,
// ඒක useCallback deps array එකට "missing dependency" lint warning එකක් දෙනවා.
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

const getHeaders = () => {
  const token = getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export default function ManageLinesPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const LINES_API = `${API_BASE_URL}/api/esp32/lines`;

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

  // ===== Fetch lines =====
  const fetchLines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(LINES_API, getHeaders());
      if (res.data?.success && res.data?.data) {
        const arr = Object.values(res.data.data) as LineRecord[];
        setLines(arr.sort((a, b) => a.lineId.localeCompare(b.lineId)));
      }
    } catch (err) {
      console.error("Error fetching lines:", err);
      showToast("error", "Failed to load lines.");
    } finally {
      setLoading(false);
    }
  }, [LINES_API]);

  // ===== Fetch available (unassigned) machines =====
  const fetchMachines = useCallback(async () => {
    try {
      const res = await axios.get(`${LINES_API}/machines`, getHeaders());
      if (res.data?.success && Array.isArray(res.data.data)) {
        setMachines(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching machines:", err);
    }
  }, [LINES_API]);

  useEffect(() => {
    let isMounted = true;

    const loadLines = async () => {
      try {
        setLoading(true);
        const res = await axios.get(LINES_API, getHeaders());
        if (isMounted && res.data?.success && res.data?.data) {
          const arr = Object.values(res.data.data) as LineRecord[];
          setLines(arr.sort((a, b) => a.lineId.localeCompare(b.lineId)));
        }
      } catch (err) {
        console.error("Error fetching lines:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLines();

    return () => {
      isMounted = false;
    };
  }, [LINES_API]);

  // ===== Modal helpers =====
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

  // ===== Submit (Assign or Update) =====
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
        await axios.post(`${LINES_API}/assign`, payload, getHeaders());
        showToast("success", `${payload.lineId} assigned to ${payload.machineId}.`);
      } else {
        await axios.put(`${LINES_API}/update`, payload, getHeaders());
        showToast("success", `${payload.lineId} updated.`);
      }
      setModalMode(null);
      fetchLines();
    } catch (err: unknown) {
      console.error("Save line error:", err);
      const message = axios.isAxiosError(err) ? err.response?.data?.message || "Something went wrong." : "Something went wrong.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  // ===== Remove assignment =====
  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await axios.delete(`${LINES_API}/remove`, {
        data: { lineId: removeTarget.lineId },
        ...getHeaders(),
      });
      showToast("success", `${removeTarget.lineId} assignment removed.`);
      setRemoveTarget(null);
      fetchLines();
    } catch (err) {
      console.error("Remove error:", err);
      showToast("error", "Failed to remove assignment.");
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
    <div
      className="min-h-screen w-full bg-[#0A0E14] p-4 text-slate-200 sm:p-6"
      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.07) 1px, transparent 0)", backgroundSize: "28px 28px" }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0F1420] p-6 shadow-xl shadow-black/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/Admin/assembly-floor")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Floor
          </button>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <Cpu className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">Admin</p>
            <h1 className="font-mono text-xl font-bold uppercase tracking-wider text-white sm:text-2xl">Manage Lines</h1>
          </div>
        </div>

        <button onClick={openAssignModal} className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400">
          <Plus className="h-4 w-4" /> Assign Line
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0F1420] px-3 py-2.5">
        <Search className="h-4 w-4 text-slate-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by line, machine, product, supervisor, floor..."
          className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
        />
      </div>

      {/* Lines Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0F1420] shadow-lg">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No lines found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 font-mono text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Line</th>
                  <th className="px-4 py-3">Machine</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Supervisor</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((line) => (
                  <tr key={line.lineId} className="border-b border-slate-800/60 transition hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-mono font-semibold text-white">{line.lineId}</td>
                    <td className="px-4 py-3">
                      {line.machineId ? (
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-xs text-cyan-400">{line.machineId}</span>
                      ) : (
                        <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-xs text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{line.productCode || "—"}</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-300">{line.dailyTarget ? line.dailyTarget.toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{line.shift || "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{line.supervisor || "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{line.floor || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(line)}
                          className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-400"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setRemoveTarget(line)}
                          disabled={!line.machineId}
                          className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
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

      {/* Assign / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0F1420] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-white">{modalMode === "assign" ? "Assign Line" : `Edit ${form.lineId}`}</h2>
              <button onClick={closeModal} className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60 disabled:opacity-50"
                />
              </Field>

              <Field label="Machine" required={modalMode === "assign"}>
                <select
                  value={form.machineId}
                  onChange={(e) => handleChange("machineId", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                >
                  <option value="">{modalMode === "edit" ? "Unassigned" : "Select machine..."}</option>
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                />
              </Field>

              <Field label="Floor">
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                  placeholder="Assembly Floor"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                />
              </Field>

              <Field label="Daily Target">
                <input
                  type="number"
                  value={form.dailyTarget}
                  onChange={(e) => handleChange("dailyTarget", e.target.value)}
                  placeholder="2880"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                />
              </Field>

              <Field label="Hourly Target">
                <input
                  type="number"
                  value={form.hourlyTarget}
                  onChange={(e) => handleChange("hourlyTarget", e.target.value)}
                  placeholder="410"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                />
              </Field>

              <Field label="Team Members">
                <input
                  type="number"
                  value={form.teamMembers}
                  onChange={(e) => handleChange("teamMembers", e.target.value)}
                  placeholder="8"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                />
              </Field>

              <Field label="Supervisor">
                <input
                  type="text"
                  value={form.supervisor}
                  onChange={(e) => handleChange("supervisor", e.target.value)}
                  placeholder="Hashini"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                />
              </Field>

              <Field label="Shift">
                <select
                  value={form.shift}
                  onChange={(e) => handleChange("shift", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60 scheme-dark"
                />
              </Field>

              <Field label="Shift Start">
                <input
                  type="time"
                  value={form.shiftStartTime}
                  onChange={(e) => handleChange("shiftStartTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60 scheme-dark"
                />
              </Field>

              <Field label="Shift End">
                <input
                  type="time"
                  value={form.shiftEndTime}
                  onChange={(e) => handleChange("shiftEndTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60 scheme-dark"
                />
              </Field>
            </div>

            {formError && (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {formError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={closeModal} disabled={saving} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {modalMode === "assign" ? "Assign" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !removing && setRemoveTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0F1420] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Remove Assignment</h2>
            </div>
            <p className="mb-5 text-sm text-slate-400">
              This clears the machine, product, target, and team details for <span className="font-mono font-semibold text-white">{removeTarget.lineId}</span>. This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setRemoveTarget(null)} disabled={removing} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200">
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
              >
                {removing && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm shadow-2xl ${toast.type === "success" ? "border-emerald-500/30 bg-emerald-950/80 text-emerald-300" : "border-red-500/30 bg-red-950/80 text-red-300"}`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

// Small field wrapper
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
        {label} {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
