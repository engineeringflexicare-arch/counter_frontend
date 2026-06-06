// app/Superuser/layout.tsx

import Link from "next/link";
import { LayoutDashboard, Factory, ClipboardCheck } from "lucide-react";

export default function SuperuserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white">
        <div className="p-4 text-xl font-bold">Superuser</div>

        <nav className="flex flex-col p-2 gap-2">
          <Link href="/Superuser" className="flex items-center gap-2 p-3 rounded hover:bg-slate-800">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link href="/Superuser/production" className="flex items-center gap-2 p-3 rounded hover:bg-slate-800">
            <Factory size={18} />
            Production
          </Link>

          <Link href="/Superuser/line-assignment" className="flex items-center gap-2 p-3 rounded hover:bg-slate-800">
            <ClipboardCheck size={18} />
            Line Assignment
          </Link>
        </nav>
      </aside>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
