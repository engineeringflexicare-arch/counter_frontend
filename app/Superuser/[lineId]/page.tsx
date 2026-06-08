import LineConfig from "@/app/components/LineConfig";
import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import GoalCompletionStatus from "@/app/components/GoalCompletionStatus";
import CumulativeChart from "@/app/components/CumulativeChart";

import Image from "next/image";
import axios from "axios";

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

  try {
    const lineRes = await axios.get(`http://localhost:3000/api/esp32/line/${lineId}`);

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
    const res = await axios.get(`http://localhost:3000/api/esp32/total-output/${machineId}`);

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
      <div className="flex items-center justify-center gap-4 mb-8">
        <Image src="/logo.png" alt="Flexicare Lanka" width={90} height={90} priority />

        <h1 className="text-4xl font-extrabold text-gray-900">flexicare Lanka Production Dashboard</h1>
      </div>

      {/* Line Title */}
      <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-6">Line Overview {lineId}</h1>

      {/* Top Section */}
      <div className="flex gap-4 items-start mb-4">
        <LineConfig lineId={lineId} />

        <div className="flex-1">
          <GoalCompletionStatus lineId={lineId} />
        </div>
      </div>

      {/* Cumulative Chart */}
      <div className="mb-4">
        <CumulativeChart machineId={machineId} cumulativeData={cumulativeChartData} daily={dailyTarget} />
      </div>

      {/* Gap Analysis */}
      <div className="mb-4">
        <ProductionGapChart machineId={machineId} />
      </div>

      {/* Production Table */}
      <ProductionTable lineId={lineId} />
    </div>
  );
}
