"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import {
  UserPlus,
  Edit,
  Trash2,
  X,
  Shield,
  Search,
  User,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  UserCheck,
  Clock,
  Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Loader from "@/app/components/Loader";

interface UserData {
  _id: string;
  FirstName: string;
  LastName: string;
  EmployeeId: string | number;
  email: string;
  role: string;
  isBlocked?: boolean;
}

interface PendingRequestData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  reason?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const ROLE_STYLES: Record<
  string,
  {
    dot: string;
    badge: string;
    stripe: string;
    icon: React.ElementType;
  }
> = {
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

// Helper function to extract error message from API response
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const apiError = error as unknown as ApiError;
    return (
      apiError?.response?.data?.message ||
      error.message ||
      "An unexpected error occurred."
    );
  }
  return "An unexpected error occurred.";
};

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<"users" | "pending">("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);

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

  const getToken = () => localStorage.getItem("token");

  // Fetch Active Users
  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) {
      toast.error("Authentication token not found. Please login again.");
      return;
    }
    try {
      const res = await api.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load users.");
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Pending Requests
  const fetchPendingRequests = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPendingLoading(true);
    try {
      const res = await api.get("/api/admin/registrations/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setPendingRequests(res.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load pending registrations.");
      console.error("Fetch pending requests error:", error);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // Safe data-fetching initializer
  useEffect(() => {
    let isMounted = true;

    const deferTimer = setTimeout(() => {
      if (isMounted) {
        fetchUsers();
        fetchPendingRequests();
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(deferTimer);
    };
  }, [fetchUsers, fetchPendingRequests]);

  // Modal Control Functions
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

  // API Functions
  const executeApproveRequest = async (
    requestId: string,
    role: string,
    requestData?: PendingRequestData
  ) => {
    const toastId = toast.loading("Approving request and processing...");
    try {
      // Check if user with same email already exists
      const existingUser = users.find(
        (u) => u.email.toLowerCase() === requestData?.email.toLowerCase()
      );

      if (existingUser) {
        // User exists - just update their role
        const updateRes = await api.put(
          `/api/users/${existingUser._id}`,
          {
            FirstName: existingUser.FirstName,
            LastName: existingUser.LastName,
            EmployeeId: existingUser.EmployeeId,
            email: existingUser.email,
            role: role,
          },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        if (updateRes.data?.success) {
          // Now reject the pending request
          await api.delete(`/api/admin/registrations/reject/${requestId}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });

          toast.success(
            `Role '${role}' assigned to existing user ${existingUser.FirstName} ${existingUser.LastName}!`,
            { id: toastId }
          );
          fetchPendingRequests();
          fetchUsers();
        }
      } else {
        // User doesn't exist - create new user and approve
        const res = await api.post(
          `/api/admin/registrations/approve/${requestId}`,
          { role },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (res.data?.success) {
          toast.success(
            "New user created and approved! Credentials emailed successfully.",
            { id: toastId }
          );
          fetchPendingRequests();
          fetchUsers();
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  const executeRejectRequest = async (requestId: string) => {
    const toastId = toast.loading("Rejecting request...");
    try {
      const res = await api.delete(
        `/api/admin/registrations/reject/${requestId}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.data?.success) {
        toast.success("Registration request rejected and removed.", {
          id: toastId,
        });
        fetchPendingRequests();
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  const executeToggleBlock = async (userId: string, endpoint: string) => {
    const toastId = toast.loading(
      `${endpoint === "block" ? "Blocking" : "Unblocking"} user...`
    );
    try {
      await api.patch(
        `/api/users/${endpoint}/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(`User ${endpoint}ed successfully!`, { id: toastId });
      fetchUsers();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.FirstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    if (!formData.LastName.trim()) {
      toast.error("Last name is required.");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required.");
      return;
    }

    const toastId = toast.loading("Adding user...");
    try {
      const res = await api.post("/api/users/add", formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data?.success) {
        toast.success("User added successfully!", { id: toastId });
        setIsAddOpen(false);
        setFormData({
          FirstName: "",
          LastName: "",
          EmployeeId: "",
          email: "",
          password: "",
          role: "Operator",
        });
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Validation
    if (!formData.FirstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    if (!formData.LastName.trim()) {
      toast.error("Last name is required.");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    const toastId = toast.loading("Updating user...");
    try {
      const res = await api.put(`/api/users/${selectedUser._id}`, formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data?.success) {
        toast.success("User updated successfully!", { id: toastId });
        setIsEditOpen(false);
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const toastId = toast.loading("Deleting user...");
    try {
      const res = await api.delete(`/api/users/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data?.success) {
        toast.success("User deleted successfully!", { id: toastId });
        setIsDeleteOpen(false);
        fetchUsers();
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  // Notification Toasts
  const handleApproveConfirm = (request: PendingRequestData) => {
    toast(
      (t) => (
        <ApproveToastContent
          t={t}
          request={request}
          onConfirm={(id, role) => executeApproveRequest(id, role, request)}
        />
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const handleRejectConfirm = (request: PendingRequestData) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="text-sm font-medium text-slate-200">
            Reject registration request from{" "}
            <span className="font-bold text-rose-400">{request.firstName}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs bg-slate-700 text-white rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                executeRejectRequest(request._id);
              }}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg font-semibold"
            >
              Yes, Reject
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const handleToggleBlock = (user: UserData) => {
    if (user.role === "Admin") {
      toast.error("Admin accounts cannot be blocked.");
      return;
    }
    const endpoint = user.isBlocked ? "unblock" : "block";
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="text-sm font-medium text-slate-200">
            Are you sure you want to{" "}
            <span className="font-bold text-cyan-400 underline">{endpoint}</span>{" "}
            this user?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs bg-slate-700 text-white rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                executeToggleBlock(user._id, endpoint);
              }}
              className={`px-3 py-1.5 text-xs text-white rounded-lg font-semibold ${
                endpoint === "block" ? "bg-red-600" : "bg-green-600"
              }`}
            >
              Yes, Sure
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  // Filtering & Calculations
  const roleCounts = useMemo(() => {
    return users.reduce(
      (acc: Record<string, number>, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {}
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        `${u.FirstName} ${u.LastName}`.toLowerCase().includes(q) ||
        String(u.EmployeeId).toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pendingRequests;
    return pendingRequests.filter(
      (r) =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
    );
  }, [pendingRequests, searchQuery]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e293b",
              color: "#fff",
              border: "1px solid #334155",
            },
          }}
        />

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-[0.2em] mb-2">
                <Shield size={14} /> Access Control
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                User Management
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Manage active directory accounts and incoming corporate
                registration tiers.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 font-mono text-xs">
                {Object.entries(ROLE_STYLES).map(([role, style]) => (
                  <div key={role} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <span className="text-slate-400 uppercase tracking-wider">
                      {role}
                    </span>
                    <span className="text-slate-200 font-semibold">
                      {roleCounts[role] || 0}
                    </span>
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 mb-6 gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2.5 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "users"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserCheck size={16} /> Active Users
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2.5 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "pending"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock size={16} /> Pending Requests
              {pendingRequests.length > 0 && (
                <span className="bg-cyan-500 text-slate-950 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Content Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {activeTab === "users" ? (
              filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Employee</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredUsers.map((user) => {
                        const { badge, dot, stripe } = getRoleStyle(
                          user.role
                        );
                        return (
                          <tr
                            key={user._id}
                            className="hover:bg-slate-800/20 transition-colors"
                          >
                            <td
                              className={`px-6 py-4 border-l-2 ${stripe}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold uppercase">
                                  {user.FirstName.charAt(0)}
                                  {user.LastName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-200">
                                    {user.FirstName} {user.LastName}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {user.email} • ID: {user.EmployeeId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ring-inset ${badge}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${dot}`}
                                />
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {user.isBlocked ? (
                                <span className="text-rose-400 text-xs font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md ring-1 ring-rose-500/30">
                                  Blocked
                                </span>
                              ) : (
                                <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md ring-1 ring-emerald-500/30">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="Edit User"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleToggleBlock(user)}
                                  className={`transition-colors ${
                                    user.isBlocked
                                      ? "text-emerald-400 hover:text-emerald-300"
                                      : "text-amber-500 hover:text-amber-400"
                                  }`}
                                  title={
                                    user.isBlocked
                                      ? "Unblock User"
                                      : "Block User"
                                  }
                                >
                                  {user.isBlocked ? (
                                    <ShieldCheck size={18} />
                                  ) : (
                                    <ShieldAlert size={18} />
                                  )}
                                </button>
                                <button
                                  onClick={() => openDeleteModal(user)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <User size={48} className="mb-4 opacity-20" />
                  <p>No active users found matching your search.</p>
                </div>
              )
            ) : pendingLoading ? (
              <div className="p-8 text-center text-slate-500">
                Loading requests...
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Applicant Info</th>
                      <th className="px-6 py-4 font-medium">
                        Department / Pos.
                      </th>
                      <th className="px-6 py-4 font-medium">Reason</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req._id}
                        className="hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-200">
                            {req.firstName} {req.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {req.email}
                          </div>
                          <div className="text-xs text-slate-500">
                            {req.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-300">
                            {req.department || "N/A"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {req.position || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="text-slate-400 max-w-xs truncate block"
                            title={req.reason}
                          >
                            {req.reason || "No reason provided"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveConfirm(req)}
                              className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium"
                            >
                              <Check size={16} /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectConfirm(req)}
                              className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium"
                            >
                              <X size={16} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Clock size={48} className="mb-4 opacity-20" />
                <p>No pending registration requests at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Add / Edit User Modal */}
        {(isAddOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">
                  {isEditOpen ? "Edit User Account" : "Add New User"}
                </h2>
                <button
                  onClick={closeFormModal}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={isEditOpen ? handleEditUser : handleAddUser}
                className="p-6 flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      First Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.FirstName}
                      onChange={(e) =>
                        setFormData({ ...formData, FirstName: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Last Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.LastName}
                      onChange={(e) =>
                        setFormData({ ...formData, LastName: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Employee ID
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.EmployeeId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        EmployeeId: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                {!isEditOpen && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Temporary Password
                    </label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    System Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    {Object.keys(ROLE_STYLES).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    {isEditOpen ? "Save Changes" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Delete User?
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Are you sure you want to permanently delete{" "}
                <strong className="text-slate-200">
                  {selectedUser.FirstName} {selectedUser.LastName}
                </strong>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-lg shadow-rose-500/20"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Custom Toast Content Component
const ApproveToastContent = ({
  t,
  request,
  onConfirm,
}: {
  t: { id: string };
  request: PendingRequestData;
  onConfirm: (id: string, role: string) => void;
}) => {
  const [selectedRole, setSelectedRole] = useState("Operator");

  return (
    <div className="flex flex-col gap-3 p-1 min-w-64">
      <p className="text-sm font-medium text-slate-200">
        Approve <span className="font-bold text-cyan-400">{request.firstName}</span>?
      </p>
      <p className="text-xs text-slate-400">
        Email: <span className="text-slate-300">{request.email}</span>
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-slate-400">
          Assign System Role:
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-cyan-500"
        >
          <option value="Operator">Operator</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Admin">Admin</option>
          <option value="Superuser">Superuser</option>
        </select>
      </div>

      <div className="text-xs text-slate-500 bg-slate-800/50 p-2 rounded">
        💡 If this email exists in active users, the role will be updated.
        Otherwise, a new user will be created.
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm(request._id, selectedRole);
          }}
          className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
        >
          Yes, Approve
        </button>
      </div>
    </div>
  );
};