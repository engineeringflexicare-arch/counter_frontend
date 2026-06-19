"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { UserPlus, Edit, Trash2, X, Shield, Search, User, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

interface UserData {
  _id: string;
  FirstName: string;
  LastName: string;
  EmployeeId: string | number;
  email: string;
  role: string;
  isBlocked?: boolean;
}

const ROLE_STYLES: Record<string, { dot: string; badge: string; stripe: string; icon: React.ElementType }> = {
  Admin: {
    dot: "bg-violet-400",
    badge: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
    stripe: "border-violet-500",
    icon: ShieldAlert,
  },
  Supervisor: {
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    stripe: "border-amber-500",
    icon: ShieldQuestion,
  },
  Superuser: {
    dot: "bg-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30",
    stripe: "border-cyan-500",
    icon: ShieldCheck,
  },
  Operator: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    stripe: "border-emerald-500",
    icon: ShieldCheck,
  },
};

const DEFAULT_STYLE = {
  dot: "bg-slate-400",
  badge: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
  stripe: "border-slate-500",
  icon: ShieldCheck,
};

const getRoleStyle = (role: string) => ROLE_STYLES[role] || DEFAULT_STYLE;

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    EmployeeId: "",
    email: "",
    password: "",
    role: "Operator",
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Please login to view users.");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setUsers(res.data.data);
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage("Failed to load users. Check console.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const roleCounts = useMemo(() => {
    return users.reduce((acc: Record<string, number>, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => `${u.FirstName} ${u.LastName}`.toLowerCase().includes(q) || String(u.EmployeeId).toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      FirstName: user.FirstName,
      LastName: user.LastName,
      EmployeeId: String(user.EmployeeId),
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const closeFormModal = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setSelectedUser(null);
  };

  const getToken = () => localStorage.getItem("token");

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/users/add`, formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage("✓ User added successfully!");
      setIsAddOpen(false);
      fetchUsers();
    } catch {
      setMessage("Failed to add user.");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await axios.put(`${API_BASE_URL}/api/users/${selectedUser._id}`, formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage("✓ User updated successfully!");
      setIsEditOpen(false);
      fetchUsers();
    } catch {
      setMessage("Failed to update user.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessage("✓ User deleted successfully!");
      setIsDeleteOpen(false);
      fetchUsers();
    } catch {
      setMessage("Failed to delete user.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-[0.2em] mb-2">
              <Shield size={14} /> Access Control
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage accounts and permission tiers for administrators, supervisors, and operators.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 font-mono text-xs">
              {Object.entries(ROLE_STYLES).map(([role, style]) => (
                <div key={role} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-slate-400 uppercase tracking-wider">{role}</span>
                  <span className="text-slate-200 font-semibold">{roleCounts[role] || 0}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setFormData({
                  FirstName: "",
                  LastName: "",
                  EmployeeId: "",
                  email: "",
                  password: "",
                  role: "Operator",
                });
                setIsAddOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 px-5 rounded-lg shadow-lg shadow-cyan-500/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <UserPlus size={18} /> Add User
            </button>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg font-mono text-sm border flex justify-between items-center ${
              message.includes("✓") ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-rose-500/10 text-rose-300 border-rose-500/30"
            }`}
          >
            {message}
            <button onClick={() => setMessage("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name, employee ID or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-slate-200 placeholder:text-slate-500 text-sm font-mono"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="p-4 font-mono font-medium text-xs uppercase tracking-widest text-slate-500">Name</th>
                  <th className="p-4 font-mono font-medium text-xs uppercase tracking-widest text-slate-500">Employee ID</th>
                  <th className="p-4 font-mono font-medium text-xs uppercase tracking-widest text-slate-500">Email</th>
                  <th className="p-4 font-mono font-medium text-xs uppercase tracking-widest text-slate-500">Access Level</th>
                  <th className="p-4 font-mono font-medium text-xs uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500 font-mono text-sm animate-pulse">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500 text-sm">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const style = getRoleStyle(user.role);
                    return (
                      <tr key={user._id} className={`border-b border-slate-800 border-l-2 ${style.stripe} hover:bg-slate-800/50 transition-colors`}>
                        <td className="p-4 font-semibold text-slate-100">
                          {user.FirstName} {user.LastName}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-sm">{user.EmployeeId}</td>
                        <td className="p-4 text-slate-400 font-mono text-sm">{user.email}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ring-1 ring-inset ${style.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => openDeleteModal(user)} className="p-2 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {/* ADD / EDIT MODAL */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-[0.2em] mb-1">
                  <Shield size={12} /> {isEditOpen ? "Edit Record" : "New Record"}
                </div>
                <h2 className="text-lg font-bold text-white">{isEditOpen ? "Edit User Details" : "Add New User"}</h2>
              </div>
              <button onClick={closeFormModal} className="text-slate-500 hover:text-slate-200 transition-colors">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={isEditOpen ? handleEditUser : handleAddUser} className="p-6 space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    <User size={14} /> First Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.FirstName}
                    onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder:text-slate-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    <User size={14} /> Last Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.LastName}
                    onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder:text-slate-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Employee ID</label>
                <input
                  required
                  type="text"
                  value={formData.EmployeeId}
                  onChange={(e) => setFormData({ ...formData, EmployeeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder:text-slate-500"
                  placeholder="EMP001"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder:text-slate-500"
                  placeholder="john@example.com"
                />
              </div>

              {/* Password (add only) */}
              {isAddOpen && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Password</label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-slate-100 placeholder:text-slate-500"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {/* Role - Updated Grid Layout */}
              <div>
                <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  <Shield size={14} /> Access Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(ROLE_STYLES).map(([role, style]) => {
                    const Icon = style.icon;
                    const active = formData.role === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-mono uppercase tracking-wide transition-colors ${
                          active ? `${style.badge} border-current` : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <Icon size={18} /> {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/40 disabled:cursor-not-allowed text-slate-950 font-semibold py-3 rounded-lg transition-colors"
                >
                  {loading ? "Saving..." : isEditOpen ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-rose-500/30">
              <Trash2 size={26} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Remove User?</h2>
            <p className="text-slate-400 text-sm mb-6">
              You&apos;re about to permanently remove{" "}
              <strong className="text-slate-100 font-mono">
                {selectedUser?.FirstName} {selectedUser?.LastName}
              </strong>{" "}
              from the system. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="flex-1 bg-rose-500 hover:bg-rose-400 disabled:bg-rose-500/40 disabled:cursor-not-allowed text-slate-950 font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
