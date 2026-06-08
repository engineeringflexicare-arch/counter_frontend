"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import LineCard from "../components/Linecard"; // ඔබගේ LineCard එක වෙනම ගොනුවක ඇතැයි උපකල්පනය කර ඇත

export default function SupervisorDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAllLines = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/api/esp32/all-lines");
        const data = res.data.data;

        if (data) {
          const linesArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
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
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Active Production Lines</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lines.map((line) => (
            <div key={line.id} onClick={() => router.push(`/Supervisor/${line.id}`)} className="cursor-pointer transition-transform hover:scale-105">
              <LineCard line={line.id} product={line.productCode || "N/A"} machine={line.machineId || "No Machine"} target={line.targetCount || 0} current={line.totalProductCount || 0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
