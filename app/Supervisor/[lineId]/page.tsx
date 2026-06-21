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

export default function Page({ params }: PageProps) {
  // Client component එකක් ඇතුළේ Promise params resolve කරගැනීම සඳහා 'use' යොදාගත යුතුය (Next.js 14/15)
  const resolvedParams = use(params);
  const lineId = resolvedParams.lineId;

  const [machineId, setMachineId] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [cumulativeChartData, setCumulativeChartData] = useState<{ time: string; cumulative: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLineDetails = async () => {
      try {
        setLoading(true);
        // "/api/esp32/lines/:lineId" කියන endpoint එක backend එකේ නැහැ (404).
        // Single line එකක් ලබාගන්න endpoint එක LineRouter එකේ "/api/lines/:lineId" කියලා.
        const lineRes = await api.get(`/api/lines/${lineId}`);

        if (lineRes.data?.success) {
          const fetchedMachineId = lineRes.data.data?.machineId;
          const target = lineRes.data.data?.dailyTarget || 0;

          if (isMounted) {
            setMachineId(fetchedMachineId || null);
            setDailyTarget(target);
          }

          // Machine ID එකක් තියෙනවා නම් පමණක් Hourly Production දත්ත ලබා ගැනීම
          if (fetchedMachineId) {
            const prodRes = await api.get(`/api/esp32/hourly-production/${fetchedMachineId}`);

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
  }, [lineId]);

  if (loading) {
    return (
      <div className="bg-neutral-50 w-full min-h-screen p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4">
      {/* Line Title */}
      <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-6">{lineId.replaceAll("_", " ")} Overview</h1>

      {/* Machine ID එකක් හමු නොවුණහොත් හෝ Error එකක් ආවොත් Message එකක් පෙන්වීම */}
      {!machineId || error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">Line Data Not Found</p>
          <p className="text-sm mt-1">Unable to load machine details for {lineId}. Please check the database connection or line configurations.</p>
        </div>
      ) : (
        <div className="animate-fade-in-up">
          {/* Top Section */}
          <div className="flex gap-4 items-start mb-4">
            <div className="flex-1">
              <LineOverviewCard lineId={lineId} />
            </div>
          </div>

          {/* Cumulative Chart (දත්ත ඇත්නම් පමණක් පෙන්වීම) */}
          {cumulativeChartData.length > 0 ? (
            <div className="mb-4">
              <CumulativeChart machineId={machineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
            </div>
          ) : (
            <div className="mb-4 bg-white border border-slate-200 p-6 rounded-2xl text-center text-slate-500">No production data available for this machine today.</div>
          )}

          {/* Gap Analysis */}
          <div className="mb-4">
            <ProductionGapChart lineId={lineId} />
          </div>

          {/* Production Table */}
          <ProductionTable lineId={lineId} />
        </div>
      )}
    </div>
  );
}
