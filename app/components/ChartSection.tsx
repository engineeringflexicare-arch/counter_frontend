"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import CumulativeChart, { CumulativeDataPoint } from "@/app/components/CumulativeChart";

interface ChartSectionProps {
  lineId: string;
}

export default function ChartSection({ lineId }: ChartSectionProps) {
  const [machineId, setMachineId] = useState("");
  const [dailyTarget, setDailyTarget] = useState(0);
  const [cumulativeData, setCumulativeData] = useState<CumulativeDataPoint[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const liveRes = await axios.get(`${API_BASE_URL}/api/esp32/line-live-data/${lineId}`);

        if (!liveRes.data.success) return;

        const machine = liveRes.data.machineId;

        setMachineId(machine);
        setDailyTarget(liveRes.data.target || 0);

        const outputRes = await axios.get(`${API_BASE_URL}/api/esp32/total-output/${machine}`);

        if (outputRes.data.success) {
          let runningTotal = 0;

          // Future 0-output hours remove
          const validHours = outputRes.data.hourlyData.filter((item: { output: number }) => item.output > 0);

          const chartData: CumulativeDataPoint[] = validHours.map((item: { hour: string; output: number }) => {
            runningTotal += item.output;

            return {
              time: item.hour.split("-")[0],
              cumulative: runningTotal,
            };
          });

          setCumulativeData(chartData);
        }
      } catch (error) {
        console.error("Chart Error:", error);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, [API_BASE_URL, lineId]);

  return <CumulativeChart machineId={machineId} cumulativeData={cumulativeData} daily={dailyTarget} />;
}
