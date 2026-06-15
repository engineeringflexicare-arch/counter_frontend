"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, Menu, Bell } from "lucide-react";
import Image from "next/image";
import { MdOutlineAccountTree, MdOutlinePrecisionManufacturing } from "react-icons/md";
import { BiLayer } from "react-icons/bi";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleString("en-GB", {
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
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      href: "/Admin/Users",
      icon: Users,
    },
    {
      name: "Assembly Floor",
      href: "/admin/assembly-floor",
      icon: BiLayer,
    },
    {
      name: "Manufacturing Floor",
      href: "/admin/manufacturing-floor",
      icon: MdOutlinePrecisionManufacturing,
    },
    {
      name: "Counters",
      href: "/admin/factories",
      icon: MdOutlineAccountTree,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          h-screen
          ${collapsed ? "w-20" : "w-72"}
          bg-slate-950 text-white
          flex flex-col transition-all duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          {!collapsed ? (
            <div>
              <h1 className="text-xl font-black">Admin Panel</h1>
              <p className="text-xs text-slate-400">Production Monitoring</p>
            </div>
          ) : (
            <div className="mx-auto text-2xl font-black">A</div>
          )}

          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 rounded-lg hover:bg-slate-800">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center
                  ${collapsed ? "justify-center" : "gap-3"}
                  px-4 py-3 rounded-xl
                  ${pathname === item.href ? "bg-blue-600" : "hover:bg-slate-800"}
                `}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 rounded-xl py-3">
            <LogOut size={18} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Flexicare" width={40} height={40} />
            <h1 className="font-bold text-xl text-slate-900">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>{currentTime}</span>

            <button>
              <Bell size={20} />
            </button>

            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">A</div>
          </div>
        </header>

        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
