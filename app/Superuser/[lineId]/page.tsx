"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import LineOverviewCard from "@/app/components/LineOverviewCard";
import InjectionMachineOverviewCard from "@/app/components/InjectionMachineOverviewCard";
import Loader from "@/app/components/Loader";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{
    lineId: string;
  }>;
}

interface HourlyItem {
  hour: string;
  output: number;
}

interface ProductionUnitData {
  lineId?: string;
  injectionMachineNumber?: string;
  floor?: string;
  machineId?: string;
  shift?: string;
  productCode?: string;
  plannedMembers?: number;
  hourlyTarget?: number;
  dailyTarget?: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
  mouldNumber?: string;
  cavities?: number;
}

export default function UnifiedOverviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams?.lineId || ""; // ID එක undefined වීමෙන් crash වීම වළක්වයි
  const isInjection = id.toUpperCase().includes("INJ");

  const [unitData, setUnitData] = useState<ProductionUnitData | null>(null);
  const [espMachineId, setEspMachineId] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!id) return; // ID එක ලැබෙන තුරු නොයන්න

    let isMounted = true;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        let resData: ProductionUnitData | null = null;

        if (isInjection) {
          // --- INJECTION MACHINE DATA FETCHING ---
          try {
            const res = await api.get(`/api/injection-machines/${id}`);
            // සමහරවිට success කියන key එක නැති වෙන්න පුළුවන්, ඒනිසා කෙලින්ම data එක ගන්නවා
            resData = res.data?.data || res.data;
          } catch {
            // Single API එක 404 දුන්නොත්, සියලුම machines අරන් අදාළ එක හොයනවා (Dashboard එකේ වගේ)
            const allRes = await api.get("/api/injection-machines/");
            const rawData = allRes.data?.data;
            const list = Array.isArray(rawData) ? rawData : rawData ? Object.values(rawData) : [];
            resData = list.find((m: unknown) => (m as ProductionUnitData).injectionMachineNumber === id) || null;
          }
        } else {
          // --- ASSEMBLY LINE DATA FETCHING ---
          try {
            const res = await api.get(`/api/lines/${id}`);
            resData = res.data?.data || res.data;
          } catch {
            // Single API එක 404 දුන්නොත්, සියලුම lines අරන් අදාළ එක හොයනවා
            const linesRes = await api.get("/api/lines/");
            const list = linesRes.data?.data || [];
            resData = list.find((line: unknown) => (line as ProductionUnitData).lineId === id) || null;
          }
        }

        // Data සාර්ථකව සොයාගත්තා නම්
        if (resData && (resData.lineId || resData.injectionMachineNumber)) {
          const fetchedEspId = resData.machineId;
          const target = resData.dailyTarget || 0;
          const shiftStartTime = resData.shiftStartTime || "08:30";
          const shiftEndTime = resData.shiftEndTime || "20:30";

          if (isMounted) {
            setUnitData(resData);
            setEspMachineId(fetchedEspId || null);
            setDailyTarget(target);
          }

          // ESP32 ID එකක් ඇත්නම් පමණක් Hourly Data ලබා ගැනීම
          if (fetchedEspId) {
            try {
              const prodRes = await api.get(
                `/api/esp32/hourly-production/${fetchedEspId}?date=${today}&shiftStartTime=${encodeURIComponent(shiftStartTime)}&shiftEndTime=${encodeURIComponent(shiftEndTime)}`,
              );

              if (prodRes.data?.success && Array.isArray(prodRes.data.hourlyData)) {
                let cumulative = 0;
                const chartData = prodRes.data.hourlyData.map((item: HourlyItem) => {
                  cumulative += item.output;
                  return { time: item.hour, cumulative };
                });

                if (isMounted) setCumulativeChartData(chartData);
              }
            } catch (err) {
              console.error("Error fetching hourly data:", err);
              // Hourly data fail වුණත් page එක ලෝඩ් වෙන්න ඉඩ හරිනවා
            }
          }
        } else {
          // කිසිදු Data එකක් නැත්නම් Error එක පෙන්වනවා
          if (isMounted) setError(true);
        }
      } catch (err) {
        console.error("Error fetching unit details:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [id, isInjection, today]);

  if (loading) {
    return (
      <div className="bg-neutral-50 w-full min-h-screen p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4 sm:p-6 min-w-0 overflow-x-hidden">
      {/* Title */}
      <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-8 tracking-wide">
        {id.replaceAll("_", " ")} <span className="text-slate-500 font-medium">Overview</span>
      </h1>

      {!espMachineId || error ? (
        <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 p-8 rounded-2xl border border-red-200 text-center max-w-2xl mx-auto mt-10">
          <AlertCircle className="w-12 h-12 mb-3 text-red-400" />
          <p className="font-bold text-lg">Data Not Found</p>
          <p className="text-sm mt-2 text-red-500">
            Unable to load details or unassigned ESP32 device for <b>{id}</b>. Please check the database configurations.
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-w-0 max-w-7xl mx-auto">
          {/* Top Section - Dynamically render the correct Card */}
          <div className="flex gap-4 items-start mb-6 w-full min-w-0">
            <div className="flex-1 min-w-0">{isInjection ? <InjectionMachineOverviewCard machineNumber={id} date={today} /> : <LineOverviewCard lineId={id} />}</div>
          </div>

          {/* Cumulative Chart */}
          {cumulativeChartData.length > 0 ? (
            <div className="mb-6 w-full min-w-0 bg-white rounded-2xl p-2 sm:p-4 shadow-sm border border-slate-200">
              <CumulativeChart machineId={espMachineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
            </div>
          ) : (
            <div className="mb-6 bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 shadow-sm flex flex-col items-center">
              <p className="font-semibold text-slate-600">No Production Data</p>
              <p className="text-sm">There is no hourly production data available for this machine today.</p>
            </div>
          )}

          {/* Gap Analysis */}
          <div className="mb-6 w-full min-w-0 bg-white rounded-2xl p-2 sm:p-4 shadow-sm border border-slate-200">
            <ProductionGapChart lineId={isInjection ? espMachineId || id : id} />
          </div>

          {/* Production Table */}
          <div className="w-full overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-4">
            <div className="w-full min-w-200">
              <ProductionTable linesData={unitData ? [unitData] : []} floor={unitData?.floor || (isInjection ? "Manufacturing" : "Assembly")} lineId={id} date={today} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
