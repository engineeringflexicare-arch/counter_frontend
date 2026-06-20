"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { UserPlus, UserCheck, UserX, Search, X } from "lucide-react";
import Loader from "@/app/components/Loader";
import toast, { Toaster } from "react-hot-toast";

interface UserData {
  _id: string;
  FirstName: string;
  LastName?: string;
  EmployeeId: number | string;
  email: string;
  role: string;
  isBlocked?: boolean;
}

export default function SuperuserUserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Add Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    EmployeeId: "",
    FirstName: "",
    LastName: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // 1. Fetch Users List
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/superuser/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted && res.data.success) {
          setUsers(res.data.data);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to load supervisors");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [API_BASE_URL, refreshTrigger]);

  // 2. Add New Supervisor Function
  const handleAddSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem("token");
    const toastId = toast.loading("Adding supervisor...");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/superuser/add`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success("Supervisor added successfully!", { id: toastId });
        setFormData({ EmployeeId: "", FirstName: "", LastName: "", email: "", password: "" });
        setRefreshTrigger((prev) => prev + 1);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to add supervisor.", { id: toastId });
      } else {
        toast.error("An unexpected error occurred.", { id: toastId });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 3. (A) ඇත්තටම Block/Unblock API එක Call කරන කොටස
  const executeToggleBlock = async (userId: string, endpoint: string) => {
    const token = localStorage.getItem("token");
    const toastId = toast.loading(`${endpoint === "block" ? "Blocking" : "Unblocking"} supervisor...`);

    try {
      const res = await axios.patch(`${API_BASE_URL}/api/superuser/${endpoint}/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        toast.success(`Supervisor ${endpoint}ed successfully!`, { id: toastId });
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error updating block status:", error);
      toast.error(`Failed to ${endpoint} supervisor.`, { id: toastId });
    }
  };

  // 🔥 3. (B) "Are you sure?" කියා අසන Custom Hot Toast එක පෙන්වන කොටස
  const handleToggleBlock = (userId: string, isBlocked: boolean) => {
    const endpoint = isBlocked ? "unblock" : "block";

    // Custom JSX Toast එකක් ලබා දීම
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="text-sm font-medium text-slate-200">
            Are you sure you want to <span className="font-bold text-blue-400 underline">{endpoint}</span> this supervisor?
          </p>
          <div className="flex justify-end gap-2">
            {/* Cancel Button */}
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors">
              No, Cancel
            </button>
            {/* Yes, Sure Button */}
            <button
              onClick={() => {
                toast.dismiss(t.id); // Confirmation toast එක අයින් කරනවා
                executeToggleBlock(userId, endpoint); // API එක call කරනවා
              }}
              className={`px-3 py-1.5 text-xs text-white rounded-lg font-semibold transition-colors ${endpoint === "block" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              Yes, Sure
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // User action එකක් ගන්නකම් Popup එක වැහෙන්නේ නැහැ
        position: "top-center", // Confirmation එක මැදින් වැටෙන්න සැලැස්වීම
      },
    );
  };

  // Search Filter
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => u.FirstName?.toLowerCase().includes(q) || u.LastName?.toLowerCase().includes(q) || String(u.EmployeeId).toLowerCase().includes(q));
  }, [users, searchQuery]);

  return (
    <>
      {/* Toaster Setup */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b", // slate-800
            color: "#fff",
            border: "1px solid #334155", // slate-700
          },
        }}
      />

      <div>{loading && <Loader />}</div>

      <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-bold text-white">Supervisor Management</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all transform hover:scale-102"
            >
              <UserPlus size={18} />
              Add Supervisor
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Table List */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase bg-slate-900/50">
                  <th className="p-4">Name</th>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500">
                      Loading supervisors...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500">
                      No supervisors found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-medium">
                        {user.FirstName} {user.LastName}
                      </td>
                      <td className="p-4 text-slate-400">{user.EmployeeId}</td>
                      <td className="p-4 text-slate-400">{user.email}</td>
                      <td className="p-4">
                        {user.isBlocked ? (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-red-950/50 text-red-400 border border-red-900 rounded-full">Blocked</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-green-950/50 text-green-400 border border-green-900 rounded-full">Active</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleBlock(user._id, !!user.isBlocked)}
                          className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                            user.isBlocked ? "bg-green-950/30 text-green-400 border-green-900 hover:bg-green-900/30" : "bg-red-950/30 text-red-400 border-red-900 hover:bg-red-900/30"
                          }`}
                          title={user.isBlocked ? "Unblock User" : "Block User"}
                        >
                          {user.isBlocked ? (
                            <span className="flex items-center gap-1">
                              <UserCheck size={14} /> Unblock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserX size={14} /> Block
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- ADD SUPERVISOR MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <UserPlus className="text-blue-500" size={22} /> Add New Supervisor
              </h2>

              <form onSubmit={handleAddSupervisor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.EmployeeId}
                    onChange={(e) => setFormData({ ...formData, EmployeeId: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 1005"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.FirstName}
                      onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.LastName}
                      onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="supervisor@flexicare.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl transition shadow-lg mt-2 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Save Supervisor"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
