"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import LineOverviewCard from "@/app/components/LineOverviewCard";
import Loader from "@/app/components/Loader";

interface PageProps {
  params: Promise<{
    lineId: string;
  }>;
}

interface HourlyItem {
  hour: string;
  output: number;
}

// ✅ FIX: ProductionTable component eka "linesData" array ekak expect karanawa
// (Assembly Floor page eke double-fetch issue eka solve karapu welawe danapu
// pattern ekata samana widihata). Mehe page eke already "/api/lines/:lineId"
// eken ganna line object eka me shape ekata match wenawa.
interface LineApiData {
  lineId?: string;
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

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  const lineId = resolvedParams.lineId;

  // 📅 අද දිනය ලබා ගැනීම සහ Date State එක හැදීම (අලුතින් එකතු කළ කොටස)
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [machineId, setMachineId] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  // ✅ FIX: Fetch කරපු line object එක මෙතන තියාගෙන, "/api/lines" දෙවෙනි වරක්
  // call නොකර ProductionTable එකට array ලෙස pass කරනවා.
  const [lineData, setLineData] = useState<LineApiData | null>(null);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLineDetails = async () => {
      try {
        setLoading(true);
        const lineRes = await api.get(`/api/lines/${lineId}`);

        if (lineRes.data?.success) {
          const fetchedLine: LineApiData = lineRes.data.data || {};
          const fetchedMachineId = fetchedLine.machineId;
          const target = fetchedLine.dailyTarget || 0;

          if (isMounted) {
            setMachineId(fetchedMachineId || null);
            setDailyTarget(target);
            setLineData({ ...fetchedLine, lineId });
          }

          // Machine ID එකක් තියෙනවා නම් අදාළ දිනයට (selectedDate) දත්ත ලබා ගැනීම
          if (fetchedMachineId) {
            const prodRes = await api.get(`/api/esp32/hourly-production/${fetchedMachineId}?date=${selectedDate}`);

            if (prodRes.data?.success && Array.isArray(prodRes.data.hourlyData)) {
              let cumulative = 0;
              const chartData = prodRes.data.hourlyData.map((item: HourlyItem) => {
                cumulative += item.output;
                return {
                  time: item.hour,
                  cumulative,
                };
              });
              if (isMounted) setCumulativeChartData(chartData);
            } else {
              // අදාළ දවසට දත්ත නැත්නම් Chart එක හිස් කිරීම
              if (isMounted) setCumulativeChartData([]);
            }
          }
        } else {
          if (isMounted) setError(true);
        }
      } catch (err) {
        console.error("Error fetching line details:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLineDetails();

    return () => {
      isMounted = false;
    };
  }, [lineId, selectedDate]); // 👈 selectedDate වෙනස් වන විට නැවත දත්ත ලබා ගනී

  if (loading) {
    return (
      <div className="bg-neutral-50 w-full min-h-screen p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4 md:p-8">
      {/* 📅 Title සහ Date Picker එක */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{lineId.replaceAll("_", " ")} Overview</h1>

        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl shadow-sm border border-slate-200">
          <label htmlFor="date" className="text-sm font-semibold text-slate-500">
            Select Date:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-medium text-slate-800 outline-none cursor-pointer bg-transparent"
          />
        </div>
      </div>

      {!machineId || error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 text-center shadow-sm">
          <p className="font-bold text-lg">Line Data Not Found</p>
          <p className="text-sm mt-2 opacity-80">Unable to load machine details for {lineId}. Please check the database connection or line configurations.</p>
        </div>
      ) : (
        <div className="animate-fade-in-up space-y-6">
          {/* Top Section */}
          <div className="w-full">
            <LineOverviewCard lineId={lineId} />
          </div>

          {/* Cumulative Chart */}
          {cumulativeChartData.length > 0 ? (
            <div className="w-full">
              <CumulativeChart machineId={machineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
            </div>
          ) : (
            <div className="w-full bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm">
              <p className="text-slate-500 font-medium">No cumulative production data available for {selectedDate}.</p>
            </div>
          )}

          {/* Gap Analysis (Date එක පාස් කර ඇත) */}
          <div className="w-full">
            <ProductionGapChart lineId={lineId} date={selectedDate} />
          </div>

          {/* Production Table (Date එක පාස් කර ඇත) */}
          <div className="w-full">
            <ProductionTable linesData={lineData ? [lineData] : []} floor={lineData?.floor} lineId={lineId} date={selectedDate} />
          </div>
        </div>
      )}
    </div>
  );
}
