"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Factory, LogOut, Menu, X, ClipboardList } from "lucide-react";
import NotificationDropdown from "../components/NotificationDropdown";
import { RiMenuFold2Line } from "react-icons/ri";

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // LocalStorage එකෙන් දත්ත ගැනීම
    const storedUser = localStorage.getItem("userName");
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(storedUser);
    }

    const updateTime = () => {
      const now = new Date();

      const formatted = now.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      setCurrentTime(formatted);
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/Supervisor",
      icon: LayoutDashboard,
    },
    {
      name: "Line Assignment",
      href: "/Supervisor/line-assignment",
      icon: Factory,
    },
    {
      name: "Lines Update",
      href: "/Supervisor/line_update",
      icon: ClipboardList,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          h-screen
          ${collapsed ? "w-20" : "w-72"}
          bg-linear-to-b
          from-slate-950
          via-slate-900
          to-slate-950
          text-white
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-3 border-b  border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Flexicare" width={45} height={45} className="rounded-full  border-slate-50 p-1 border-2 " />

            {!collapsed && (
              <div>
                <h1 className="text-lg font-black">flexicare</h1>
                <p className="text-xs text-slate-400">Production Dashboard</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Toggle */}
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-800">
              <Menu size={18} />
            </button>

            {/* Mobile Close (Inside Sidebar) */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center
                  ${collapsed ? "justify-center" : "gap-3"}
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${active ? "bg-blue-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-800"}
                `}
              >
                <Icon size={20} />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          {!collapsed && (
            <div className="bg-slate-800 rounded-xl p-4 mb-3">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="font-bold text-lg">{userName}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full
              flex items-center
              ${collapsed ? "justify-center" : "justify-center gap-2"}
              bg-red-600
              hover:bg-red-700
              rounded-xl
              py-3
              transition-all
              font-semibold
            `}
          >
            <LogOut size={18} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button (Updated) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-600 transition-all duration-300 ease-in-out"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X size={22} className="animate-in fade-in zoom-in duration-200" /> : <RiMenuFold2Line size={22} className="animate-in fade-in zoom-in duration-200" />}
            </button>

            <h1 className="text-sm md:text-xl font-bold text-slate-800">flexicare Production Monitoring System</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Date & Time */}
            <div className="hidden lg:flex flex-col items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-sm font-bold text-slate-800">{currentTime}</span>
            </div>

            {/* Notification */}
            <NotificationDropdown />

            {/* User Info */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-700">{userName}</p>
              <p className="text-xs text-slate-500">Production Department</p>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{userName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
