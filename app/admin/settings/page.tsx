"use client";

import { useState } from "react";
import ConfigList from "@/app/components/admin/ConfigList";
import ConfigManager from "@/app/components/admin/ConfigManager";
import LogViewer from "@/app/components/admin/LogViewer";
import { Plus, List, FileText } from "lucide-react";
import { useSidebar } from "@/app/context/SidebarContext";

type Tab = "add" | "view" | "logs";

const tabs: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "add", label: "Add Config", icon: Plus, description: "Create a new counter configuration" },
  { id: "view", label: "View Configs", icon: List, description: "Manage existing configurations" },
  { id: "logs", label: "View Logs", icon: FileText, description: "Monitor system activity" },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const { collapsed } = useSidebar();

  const current = tabs.find((t) => t.id === activeTab)!;
  const Icon = current.icon;

  return (
    <div className="flex h-full">
      {/* Settings Sub-Sidebar — hides when main sidebar is collapsed */}
      <aside
        className={`
          shrink-0 bg-slate-950 flex flex-col rounded-l-xl
          overflow-hidden transition-all duration-300
          ${collapsed ? "w-0 opacity-0 pointer-events-none" : "w-56 opacity-100"}
        `}
      >
        <div className="px-5 pt-5 pb-3 border-b border-slate-800 whitespace-nowrap">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Settings</p>
          <p className="text-xs text-slate-500 mt-0.5">Counter Configurations</p>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {tabs.map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left w-full
                transition-all duration-150 border-l-2 whitespace-nowrap
                ${activeTab === id ? "bg-blue-600 text-white border-blue-400" : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-100"}
              `}
            >
              <TabIcon size={17} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col bg-slate-100 rounded-r-xl overflow-hidden">
        {/* Content Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{current.label}</p>
            <p className="text-xs text-slate-400">{current.description}</p>
          </div>
        </div>

        {/* Panel */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            {activeTab === "add" && <ConfigManager />}
            {activeTab === "view" && <ConfigList />}
            {activeTab === "logs" && <LogViewer />}
          </div>
        </div>
      </div>
    </div>
  );
}
