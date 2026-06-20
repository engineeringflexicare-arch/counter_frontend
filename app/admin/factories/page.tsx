"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, Search, Plus, Edit, Trash2, Check, AlertCircle } from "lucide-react";

export default function FactoriesPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState<string>("Administrator");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [searchFactory, setSearchFactory] = useState("");

  // Sample factories data
  const [factories, setFactories] = useState([
    {
      id: 1,
      name: "Main Factory",
      location: "New York, NY",
      status: "active",
      employees: 250,
      email: "main@flexicare.com",
    },
    {
      id: 2,
      name: "Secondary Factory",
      location: "Los Angeles, CA",
      status: "active",
      employees: 180,
      email: "secondary@flexicare.com",
    },
    {
      id: 3,
      name: "Eastern Factory",
      location: "Miami, FL",
      status: "inactive",
      employees: 120,
      email: "eastern@flexicare.com",
    },
  ]);

  // ✅ FIXED: Use callback function instead of direct setState
  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");
      const storedUserName = localStorage.getItem("userName");

      // Check if user is authenticated and has admin role
      if (!token || userRole !== "Admin") {
        setIsAuthenticated(false);
        router.push("/login");
        return;
      }

      // Set username with fallback
      if (storedUserName && storedUserName.trim()) {
        setUserName(storedUserName);
      } else {
        setUserName("Administrator");
      }

      setIsAuthenticated(true);
    };

    checkAuthentication();
  }, [router]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    router.push("/login");
  };

  // Delete factory
  const deleteFactory = (id: number) => {
    setFactories(factories.filter((factory) => factory.id !== id));
  };

  // Toggle factory status
  const toggleFactoryStatus = (id: number) => {
    setFactories(factories.map((factory) => (factory.id === id ? { ...factory, status: factory.status === "active" ? "inactive" : "active" } : factory)));
  };

  // Filter factories
  const filteredFactories = factories.filter(
    (factory) =>
      factory.name.toLowerCase().includes(searchFactory.toLowerCase()) ||
      factory.location.toLowerCase().includes(searchFactory.toLowerCase()) ||
      factory.email.toLowerCase().includes(searchFactory.toLowerCase()),
  );

  // ✅ FIXED: Return loading state while authenticating
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-linear-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 z-40 ${sidebarOpen ? "w-64" : "w-20"}`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center w-full"}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-900 font-bold">F</span>
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Flexicare</span>}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="mt-6 space-y-2 px-3">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "factories", label: "Factories", icon: FileText },
            { id: "users", label: "Users", icon: Users },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  item.id === "factories" ? "bg-white text-blue-900 font-semibold shadow-lg" : "text-blue-100 hover:bg-blue-700"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition ${!sidebarOpen && "justify-center"}`}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Factories Management</h1>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                {/* ✅ FIXED: Use nullish coalescing operator with default */}
                <p className="font-semibold text-slate-900">{userName ?? "Administrator"}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">{(userName ?? "A").charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search factories..."
                  value={searchFactory}
                  onChange={(e) => setSearchFactory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <button className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center gap-2">
              <Plus size={20} />
              Add Factory
            </button>
          </div>

          {/* Factories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFactories.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <AlertCircle className="mx-auto mb-4 text-slate-400" size={48} />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Factories Found</h3>
                <p className="text-slate-600">Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredFactories.map((factory) => (
                <div key={factory.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{factory.name}</h3>
                      <p className="text-sm text-slate-600">{factory.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${factory.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {factory.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-slate-600">
                      <strong>Email:</strong> {factory.email}
                    </p>
                    <p className="text-slate-600">
                      <strong>Employees:</strong> {factory.employees}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFactoryStatus(factory.id)}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      Toggle
                    </button>
                    <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2">
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteFactory(factory.id)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
