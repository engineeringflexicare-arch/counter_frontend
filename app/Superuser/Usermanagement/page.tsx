"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Edit, Trash2 } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  role: string;
}

export default function SuperuserUserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/superuser/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setUsers(res.data.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => u.name?.toLowerCase().includes(q) || u.employeeId?.toLowerCase().includes(q));
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-white">Supervisor Management</h1>
        </div>

        <input type="text" placeholder="Search..." className="w-full mb-6 p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm" onChange={(e) => setSearchQuery(e.target.value)} />

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="p-4">Name</th>
                <th className="p-4">Employee ID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800">
                    <td className="p-4">{user.name}</td>
                    <td className="p-4 text-slate-400">{user.employeeId}</td>
                    <td className="p-4 flex gap-2 justify-end">
                      <button className="p-2 hover:text-amber-300">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:text-rose-300">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
