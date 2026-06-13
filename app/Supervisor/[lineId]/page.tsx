"use client";

import { useState } from "react";
import ProductionTable from "@/app/components/ProductionTable";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams<{ lineId: string }>();
  // params.lineId එක undefined විය හැකි නිසා string එකක් ලෙස සහතික කිරීම
  const lineId = params?.lineId || "";

  // අද දිනය YYYY-MM-DD ආකෘතියෙන් ලබා ගැනීම
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  return (
    <div className="flex flex-col bg-neutral-50 rounded-xs w-full min-h-screen p-6">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl text-slate-900 font-extrabold font-sans text-center">{lineId.replaceAll("_", " ")} Line Overview</h1>

        {/* Date Picker එක */}
        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-lg shadow-sm border border-slate-200">
          <label htmlFor="date" className="text-sm font-semibold text-slate-600">
            Select Date:
          </label>
          <input type="date" id="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-sm text-slate-800 outline-none cursor-pointer bg-transparent" />
        </div>
      </div>

      {/* Production Table එකට lineId සහ date යන props යැවීම */}
      <div className="w-full">{lineId ? <ProductionTable lineId={lineId} date={selectedDate} /> : <p className="text-center text-slate-500">Loading line data...</p>}</div>
    </div>
  );
}
