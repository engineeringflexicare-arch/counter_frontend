import ProductionTable from "@/app/components/ProductionTable";
import ProductionGapChart from "@/app/components/ProductionGapChart";
import CumulativeChart from "@/app/components/CumulativeChart";
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
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // 1. Hardcode අගයන් වෙනුවට මුලදී හිස් (null/0) අගයන් ලබා දීම
  let machineId: string | null = null;
  let dailyTarget: number = 0;
  let cumulativeChartData: { time: string; cumulative: number }[] = [];

  try {
    // 2. Line Details ලබා ගැනීම (Axios වෙනුවට Fetch භාවිතය වඩා සුදුසුය)
    const lineRes = await fetch(`${API_BASE_URL}/api/esp32/lines/${lineId}`, { cache: "no-store" });

    if (lineRes.ok) {
      const lineData = await lineRes.json();
      if (lineData.success) {
        // API එකෙන් එන දත්ත පමණක් Assign කිරීම
        machineId = lineData.data?.machineId;
        dailyTarget = lineData.data?.dailyTarget || 0; // Target එකක් නැත්නම් 0 වේ
      }
    } else {
      console.error(`Failed to fetch line details. Status: ${lineRes.status}`);
    }
  } catch (error) {
    console.error("Error fetching line details:", error);
  }

  // 3. Machine ID එකක් තියෙනවා නම් පමණක් Hourly Production දත්ත ලබා ගැනීම
  if (machineId) {
    try {
      const prodRes = await fetch(`${API_BASE_URL}/api/esp32/hourly-production/${machineId}`, { cache: "no-store" });

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.success && Array.isArray(prodData.hourlyData)) {
          let cumulative = 0;
          cumulativeChartData = prodData.hourlyData.map((item: HourlyItem) => {
            cumulative += item.output;
            return {
              time: item.hour,
              cumulative,
            };
          });
        }
      } else {
        console.error(`Failed to fetch hourly production. Status: ${prodRes.status}`);
      }
    } catch (error) {
      console.error("Error fetching cumulative chart:", error);
    }
  }

  return (
    <div className="bg-neutral-50 w-full min-h-screen p-4">
      {/* Line Title */}
      <h1 className="text-2xl font-extrabold text-center text-slate-800 mb-6">{lineId} Overview</h1>

      {/* Machine ID එකක් හමු නොවුණහොත් Error Message එකක් පෙන්වීම */}
      {!machineId ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
          <p className="font-semibold">Line Data Not Found</p>
          <p className="text-sm mt-1">Unable to load machine details for {lineId}. Please check the database.</p>
        </div>
      ) : (
        <>
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
            <div className="mb-4 bg-slate-100 p-6 rounded-2xl text-center text-slate-500">No production data available for this machine today.</div>
          )}

          {/* Gap Analysis */}
          <div className="mb-4">
            <ProductionGapChart lineId={lineId} />
          </div>

          {/* Production Table */}
          <ProductionTable lineId={lineId} />
        </>
      )}
    </div>
  );
}
