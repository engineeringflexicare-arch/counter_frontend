"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Factory, LogOut, Menu, X } from "lucide-react";

export default function SuperuserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/Superuser",
      icon: LayoutDashboard,
    },
    {
      name: "Production",
      href: "/Superuser/production",
      icon: Factory,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
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
          transition-all duration-300

          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-xl font-sans font-black">flexicare Dashboard</h1>

              <p className="text-xs text-slate-400 mt-1">Production Monitoring</p>
            </div>
          )}

          {collapsed && <div className="mx-auto text-2xl font-black">f</div>}

          <div className="flex items-center gap-2">
            {/* Desktop Toggle */}
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-800 transition">
              <Menu size={20} />
            </button>

            {/* Mobile Close */}
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
              transition-all
              rounded-xl
              py-3
              font-semibold
            `}
          >
            <LogOut size={18} />

            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Topbar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shadow-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
            <Menu size={22} />
          </button>

          <h2 className="ml-3 font-bold text-slate-800">Flexi Dashboard</h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
