import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
import axios from "axios";
import LineOverviewCard from "@/app/components/LineOverviewCard";

interface PageProps {
  params: Promise<{
    lineId: string;
  }>;
}

interface HourlyItem {
  hour: string;
  output: number;
}

export default async function Page({ params }: PageProps) {
  const { lineId } = await params;

  let machineId = "Machine_01";
  let dailyTarget = 4300;

  // Base URL එක ලබා ගැනීම (නම නිවැරදි කර ඇත: NEXT_PUBLIC_API_BASE_URL)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  try {
    // 1. පරණ /line/ වෙනුවට අලුත් /lines/ route එක යොදා ඇත
    const lineRes = await axios.get(`${API_BASE_URL}/api/esp32/lines/${lineId}`);

    if (lineRes.data?.success) {
      machineId = lineRes.data.data?.machineId || "Machine_01";
      dailyTarget = lineRes.data.data?.dailyTarget || 4300;
    }
  } catch (error) {
    console.error("Error fetching line details:", error);
  }

  let cumulativeChartData: {
    time: string;
    cumulative: number;
  }[] = [];

  try {
    // 2. පරණ /total-output/ වෙනුවට අලුත් /hourly-production/ route එක යොදා ඇත
    const res = await axios.get(`${API_BASE_URL}/api/esp32/hourly-production/${machineId}`);

    if (res.data?.success && Array.isArray(res.data.hourlyData)) {
      let cumulative = 0;

      cumulativeChartData = res.data.hourlyData.map((item: HourlyItem) => {
        cumulative += item.output;

        return {
          time: item.hour,
          cumulative,
        };
      });
    }
  } catch (error) {
    console.error("Error fetching cumulative chart:", error);
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4">
      {/* Header */}

      {/* Line Title */}
      <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-6">{lineId} Overview </h1>

      {/* Top Section */}
      <div className="flex gap-4 items-start mb-4">
        <div className="flex-1">
          <LineOverviewCard lineId={lineId} />
        </div>
      </div>

      {/* Cumulative Chart */}
      <div className="mb-4">
        <CumulativeChart machineId={machineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
      </div>

      {/* Gap Analysis */}
      <div className="mb-4">
        <ProductionGapChart lineId={lineId} />
      </div>

      {/* Production Table */}
      <ProductionTable lineId={lineId} />
    </div>
  );
}
