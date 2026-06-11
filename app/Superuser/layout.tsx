"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Factory, LogOut, Menu, X, Bell } from "lucide-react";
import Image from "next/image";

export default function SuperuserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/Superuser",
      icon: LayoutDashboard,
    },
    {
      name: "Asembly Foor",
      href: "/Superuser/Asemblyfoor",
      icon: Factory,
    },
    {
      name: "Manufacturing Floor",
      href: "/Superuser/Manufacturingfloor",
      icon: Factory,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Overlay */}
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
          transition-all duration-300

          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          {!collapsed ? (
            <div>
              <h1 className="text-xl font-black">Flexicare Dashboard</h1>

              <p className="text-xs text-slate-400 mt-1">Production Monitoring</p>
            </div>
          ) : (
            <div className="mx-auto text-2xl font-black">F</div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-800">
              <Menu size={20} />
            </button>

            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-800" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
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

              <p className="font-bold text-lg">Superuser</p>
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
              font-semibold
              transition-all
            `}
          >
            <LogOut size={18} />

            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu size={22} />
            </button>

            <div className="flex items-center justify-center gap-4 mb-1">
              {/* මෙතන තමයි වෙනස් කළේ 👇 */}
              <Image src="/logo.png" alt="Flexicare Lanka" width={40} height={40} style={{ width: "auto", height: "40px" }} priority />

              <h1 className="text-xl font-extrabold text-gray-900">flexicare Lanka Production Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Date & Time */}
            <div className="hidden lg:flex flex-col items-center bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
              <span className="text-sm font-bold text-slate-800">{currentTime}</span>
            </div>

            {/* Notification */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100">
              <Bell size={20} />

              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-700">Superuser</p>

              <p className="text-xs text-slate-500">Production Department</p>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">S</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
