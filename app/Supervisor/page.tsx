"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import LineCard from "../components/Linecard";

// 1. API එකෙන් එන දත්ත වල හැඩය
interface ApiLineData {
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  dailyTarget?: number;
  totalProductCount?: number;
}

// 2. Component එක ඇතුළේ භාවිතා කරන දත්ත වල හැඩය
interface LineData extends ApiLineData {
  id: string;
}

export default function SupervisorDashboard() {
  const [lines, setLines] = useState<LineData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // අනෙක් සංරචක සමඟ ගැළපීමට NEXT_PUBLIC_API_BASE_URL ලෙස වෙනස් කරන ලදී
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchAllLines = async () => {
      try {
        const token = localStorage.getItem("token"); // Auth token එකක් අවශ්‍ය නම් ඒකත් එකතු කළා
        const res = await axios.get(`${API_BASE_URL}/api/esp32/lines`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data?.data as Record<string, ApiLineData>;

        if (data) {
          const linesArray: LineData[] = Object.entries(data).map(([key, value]) => ({
            ...value,
            id: key,
          }));

          setLines(linesArray);
        }
      } catch (err) {
        console.error("Error fetching lines:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLines();

    // තත්පර 30කට වරක් දත්ත ස්වයංක්‍රීයව යාවත්කාලීන කිරීම
    const interval = setInterval(fetchAllLines, 30000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  if (loading && lines.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-10 text-center text-gray-500 font-semibold animate-pulse">Loading Production Lines...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-Google_Sans bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold font-sans text-gray-900 mb-8 text-center">Active Production Lines</h1>

        <div className="flex flex-wrap justify-items-start gap-2">
          {lines.map((line) => (
            <div
              key={line.id}
              // URL එකේ spaces තිබුනොත් ඒවා %20 ලෙස නිවැරදිව encode කිරීමට encodeURIComponent භාවිතා කරන ලදී
              onClick={() => router.push(`/Supervisor/${encodeURIComponent(line.id)}`)}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              <LineCard
                line={line.id}
                product={line.productCode || "N/A"}
                machine={line.machineId || "No Machine"}
                target={line.dailyTarget || line.targetCount || 0}
                current={line.totalProductCount || 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
