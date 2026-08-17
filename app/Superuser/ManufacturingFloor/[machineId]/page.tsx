"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import InjectionMachineOverviewCard from "@/app/components/InjectionMachineOverviewCard";
import Loader from "@/app/components/Loader";

interface PageProps {
  params: Promise<{
    lineId: string; // Dynamic route param (e.g. INJ_01)
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
  machineId?: string; // ESP32 Device ID
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
  const machineNumber = resolvedParams.lineId; // Route param එකෙන් machine number එක ලබා ගැනීම

  const [machineData, setMachineData] = useState<InjectionMachineData | null>(null);
  const [espMachineId, setEspMachineId] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let isMounted = true;

    const fetchMachineDetails = async () => {
      try {
        setLoading(true);
        // ✅ Updated API endpoint for injection machines
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

          // ESP32 Device ID එකක් ඇත්නම් පමණක් Hourly Production දත්ත ලබා ගැනීම
          if (fetchedEspId) {
            const prodRes = await api.get(
              `/api/esp32/hourly-production/${fetchedEspId}` + `?date=${today}&shiftStartTime=${encodeURIComponent(shiftStartTime)}&shiftEndTime=${encodeURIComponent(shiftEndTime)}`,
            );

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
  }, [machineNumber, today]);

  if (loading) {
    return (
      <div className="bg-neutral-50 w-full min-h-screen p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4 min-w-0 overflow-x-hidden">
      {/* Title */}
      <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-6">{machineNumber.replaceAll("_", " ")} Machine Overview</h1>

      {!espMachineId || error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">Machine Data Not Found</p>
          <p className="text-sm mt-1">Unable to load details or unassigned ESP32 for {machineNumber}. Please check configurations.</p>
        </div>
      ) : (
        <div className="animate-fade-in-up w-full min-w-0">
          {/* Top Section */}
          <div className="flex gap-4 items-start mb-4">
            <div className="flex-1 min-w-0">
              <InjectionMachineOverviewCard machineNumber={machineNumber} date={today} />
            </div>
          </div>

          {/* Cumulative Chart */}
          {cumulativeChartData.length > 0 ? (
            <div className="mb-4 w-full min-w-0">
              <CumulativeChart machineId={espMachineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
            </div>
          ) : (
            <div className="mb-4 bg-white border border-slate-200 p-6 rounded-2xl text-center text-slate-500">No production data available for this machine today.</div>
          )}

          {/* Gap Analysis — ✅ FIX: lineId වෙනුවට espMachineId හෝ machineNumber නිවැරදිව ලබා දීම */}
          <div className="mb-4 w-full min-w-0">
            <ProductionGapChart lineId={espMachineId || machineNumber} />
          </div>

          {/* Production Table */}
          <div className="w-full overflow-x-auto">
            <div className="w-full">
              <ProductionTable linesData={machineData ? [machineData] : []} floor={machineData?.floor} lineId={machineNumber} date={today} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
