import GoalCompletionStatus from "@/app/components/GoalCompletionStatus";
import LineConfig from "@/app/components/LineConfig";
import ProductionTable from "@/app/components/ProductionTable";
import ChartSection from "@/app/components/ChartSection";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import Image from "next/image";

interface PageProps {
  params: Promise<{
    lineId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { lineId } = await params;

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Image src="/logo.png" alt="Flexicare Lanka" width={90} height={90} priority />

        <h1 className="text-4xl font-extrabold text-gray-900">Flexicare Lanka Production Dashboard</h1>
      </div>
      <h1 className="text-2xl font-extrabold text-center mb-4">Line Overview {lineId}</h1>

      {/* Top Section */}
      <div className="flex gap-4 items-start mb-4">
        {/* Left Side */}
        <LineConfig lineId={lineId} />

        {/* Right Side */}
        <div className="flex-1">
          <GoalCompletionStatus lineId={lineId} />
        </div>
      </div>

      {/* Cumulative Chart */}
      <div className="mb-4">
        <ChartSection lineId={lineId} />
      </div>

      {/* Production Gap Chart */}
      <div className="mb-4">
        <ProductionGapChart machineId="Machine_01" />
      </div>

      {/* Production Table */}
      <ProductionTable lineId={lineId} />
    </div>
  );
}
