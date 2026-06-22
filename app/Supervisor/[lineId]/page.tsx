"use client";

import { useEffect, useState, use } from "react";
import api from "@/lib/api"; // අපේ custom axios instance එක import කරගැනීම
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

// Shape of the line record returned by /api/lines/:lineId
// (matches the backend Line model fields ProductionTable expects)
interface LineData {
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
  // Client component එකක් ඇතුළේ Promise params resolve කරගැනීම සඳහා 'use' යොදාගත යුතුය (Next.js 14/15)
  const resolvedParams = use(params);
  const lineId = resolvedParams.lineId;

  // FIX: keep the full line record in state (not just machineId/dailyTarget
  // pulled out of it) so it can be passed down to ProductionTable, which
  // needs shiftStartTime/shiftEndTime/floor/etc.
  const [lineData, setLineData] = useState<LineData | null>(null);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Today's date as YYYY-MM-DD, used for both the chart fetch and the table prop
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let isMounted = true;

    const fetchLineDetails = async () => {
      try {
        setLoading(true);
        // "/api/esp32/lines/:lineId" කියන endpoint එක backend එකේ නැහැ (404).
        // Single line එකක් ලබාගන්න endpoint එක LineRouter එකේ "/api/lines/:lineId" කියලා.
        const lineRes = await api.get(`/api/lines/${lineId}`);

        if (lineRes.data?.success) {
          const fetchedLine: LineData = lineRes.data.data || {};
          const fetchedMachineId = fetchedLine.machineId;
          const target = fetchedLine.dailyTarget || 0;
          // FIX: pull this line's own shift window so the backend builds
          // buckets for the real shift instead of defaulting to 00:00-23:59
          const shiftStartTime = fetchedLine.shiftStartTime || "08:30";
          const shiftEndTime = fetchedLine.shiftEndTime || "20:30";

          if (isMounted) {
            setLineData(fetchedLine);
            setMachineId(fetchedMachineId || null);
            setDailyTarget(target);
          }

          // Machine ID එකක් තියෙනවා නම් පමණක් Hourly Production දත්ත ලබා ගැනීම
          if (fetchedMachineId) {
            const prodRes = await api.get(
              `/api/esp32/hourly-production/${fetchedMachineId}` + `?date=${today}&shiftStartTime=${encodeURIComponent(shiftStartTime)}&shiftEndTime=${encodeURIComponent(shiftEndTime)}`,
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
  }, [lineId, today]);

  if (loading) {
    return (
      <div className="bg-neutral-50 w-full min-h-screen p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4 min-w-0 overflow-x-hidden">
      {" "}
      {/* 👈 min-w-0 සහ overflow-x-hidden එක් කරන ලදී */}
      {/* Line Title */}
      <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-6">{lineId.replaceAll("_", " ")} Overview</h1>
      {!machineId || error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">Line Data Not Found</p>
          <p className="text-sm mt-1">Unable to load machine details for {lineId}. Please check the database connection or line configurations.</p>
        </div>
      ) : (
        <div className="animate-fade-in-up w-full min-w-0">
          {" "}
          {/* 👈 මෙතැනට w-full min-w-0 එක් කරන්න */}
          {/* Top Section */}
          <div className="flex gap-4 items-start mb-4">
            <div className="flex-1 min-w-0">
              {" "}
              {/* 👈 flex child එකකට min-w-0 අනිවාර්ය වේ */}
              <LineOverviewCard lineId={lineId} />
            </div>
          </div>
          {/* Cumulative Chart */}
          {cumulativeChartData.length > 0 ? (
            <div className="mb-4 w-full min-w-0">
              {" "}
              {/* 👈 w-full min-w-0 එක් කරන්න */}
              <CumulativeChart machineId={machineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
            </div>
          ) : (
            <div className="mb-4 bg-white border border-slate-200 p-6 rounded-2xl text-center text-slate-500">No production data available for this machine today.</div>
          )}
          {/* Gap Analysis */}
          <div className="mb-4 w-full min-w-0">
            {" "}
            {/* 👈 Recharts chart එක පවතින wrapper එකට w-full min-w-0 අනිවාර්යයෙන්ම එක් කරන්න */}
            <ProductionGapChart lineId={lineId} />
          </div>
          {/* Production Table */}
          <div className="w-full overflow-x-auto">
            {" "}
            {/* 👈 Table එකක් නිසා layout එක එළියට පැනීම වැළැක්වීමට */}
            <div className="w-full">
              <ProductionTable linesData={lineData ? [lineData] : []} floor={lineData?.floor} lineId={lineId} date={today} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
