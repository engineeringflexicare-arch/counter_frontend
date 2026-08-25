"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import { Search } from "lucide-react";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import InjectionMachineOverviewCard from "@/app/components/InjectionMachineOverviewCard";
import Loader from "@/app/components/Loader";

interface PageProps {
  params: Promise<{
    machineId: string; // ✅ lineId වෙනුවට machineId ලෙස නිවැරදි කළා
  }>;
}

interface HourlyItem {
  hour: string;
  output: number;
}

interface InjectionMachineData {
  injectionMachineNumber?: string;
  mouldNumber?: string;
  cavities?: number;
  floor?: string;
  machineId?: string;
  shift?: string;
  productCode?: string;
  plannedMembers?: number;
  hourlyTarget?: number;
  dailyTarget?: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

export default function MachineOverviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  // ✅ resolvedParams.lineId වෙනුවට machineId ලබා ගනී. (Error එක මඟහැරීමට fallback එකක්ද යොදා ඇත)
  const machineNumber = resolvedParams.machineId || "";

  const today = new Date().toISOString().split("T")[0];
  const [inputDate, setInputDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today); // 📅 Date State

  const [machineData, setMachineData] = useState<InjectionMachineData | null>(null);
  const [espMachineId, setEspMachineId] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!machineNumber) return; // ✅ machineNumber නැත්නම් API Call එක යන්නේ නැහැ

    const fetchMachineDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/injection-machines/${machineNumber}`);

        if (res.data?.success) {
          const fetchedRecord: InjectionMachineData = res.data.data || {};
          const fetchedEspId = fetchedRecord.machineId;
          const target = fetchedRecord.dailyTarget || 0;
          const shiftStartTime = fetchedRecord.shiftStartTime || "08:30";
          const shiftEndTime = fetchedRecord.shiftEndTime || "20:30";

          if (isMounted) {
            setMachineData(fetchedRecord);
            setEspMachineId(fetchedEspId || null);
            setDailyTarget(target);
          }

          if (fetchedEspId) {
            // 📅 API call එකට selectedDate යැවීම
            const prodRes = await api.get(
              `/api/esp32/hourly-production/${fetchedEspId}?date=${selectedDate}&shiftStartTime=${encodeURIComponent(shiftStartTime)}&shiftEndTime=${encodeURIComponent(shiftEndTime)}`,
            );

            if (prodRes.data?.success && Array.isArray(prodRes.data.hourlyData)) {
              let cumulative = 0;
              const chartData = prodRes.data.hourlyData.map((item: HourlyItem) => {
                cumulative += item.output;
                return { time: item.hour, cumulative };
              });
              if (isMounted) setCumulativeChartData(chartData);
            } else {
              if (isMounted) setCumulativeChartData([]);
            }
          }
        } else {
          if (isMounted) setError(true);
        }
      } catch (err) {
        console.error("Error fetching machine details:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMachineDetails();

    return () => {
      isMounted = false;
    };
  }, [machineNumber, selectedDate]); // 📅 selectedDate වෙනස් වූ විට ක්‍රියාත්මක වේ

  if (loading) {
    return (
      <div className="bg-neutral-50 w-full min-h-screen p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4 md:p-8 min-w-0 overflow-x-hidden">
      {/* 📅 Header with Date Picker */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        {/* ✅ දැන් machineNumber එක හැමවෙලේම String එකක් නිසා error එකක් එන්නේ නැහැ */}
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{machineNumber.replaceAll("_", " ")} Overview</h1>

        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl shadow-sm border border-slate-200">
          <label htmlFor="date" className="text-sm font-semibold text-slate-500">
            Select Date:
          </label>
          <input type="date" id="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="text-sm font-medium text-slate-800 outline-none cursor-pointer bg-transparent" />
          <button onClick={() => setSelectedDate(inputDate)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors">
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
        </div>
      </div>

      {!espMachineId || error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 text-center shadow-sm">
          <p className="font-bold text-lg">Machine Data Not Found</p>
          <p className="text-sm mt-2 opacity-80">Unable to load details or unassigned ESP32 for {machineNumber}. Please check configurations.</p>
        </div>
      ) : (
        <div className="animate-fade-in-up w-full min-w-0 space-y-6">
          <div className="w-full">
            <InjectionMachineOverviewCard machineNumber={machineNumber} date={selectedDate} />
          </div>

          {cumulativeChartData.length > 0 ? (
            <div className="w-full">
              <CumulativeChart machineId={espMachineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
            </div>
          ) : (
            <div className="w-full bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm">
              <p className="text-slate-500 font-medium">No cumulative production data available for {selectedDate}.</p>
            </div>
          )}

          <div className="w-full">
            {/* 📅 Components වලට Date එක යැවීම */}
            <ProductionGapChart lineId={espMachineId || machineNumber} date={selectedDate} />
          </div>

          <div className="w-full">
            <ProductionTable linesData={machineData ? [machineData] : []} floor={machineData?.floor} lineId={machineNumber} date={selectedDate} />
          </div>
        </div>
      )}
    </div>
  );
}
