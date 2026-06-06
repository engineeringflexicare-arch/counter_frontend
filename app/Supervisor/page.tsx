"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SupervisorDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAllLines = async () => {
      try {
        setLoading(true);
        // ඔබ සතුව ඇති API එක ඇමතීම
        const res = await axios.get("http://localhost:3000/api/esp32/all-lines");
        const data = res.data.data;
        console.log("PAGE MACHINE ID:", res.data.machineId);

        // Firebase දත්ත Object එකක් නම්, එය Array එකක් කරගැනීම
        if (data) {
          const linesArray = Object.keys(data).map((key) => ({
            id: key, // Line_01, Line_02 වැනි ID
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

  if (loading) return <div className="p-10 text-center">Loading all lines...</div>;

  return (
    <div className="p-1.5 bg-gray-50 min-h-screen">
      <h1 className="text-3xl  mb-8 text-gray-800 text-center p-4 font-sans font-extrabold">Active Production Lines</h1>

      {/* සියලුම ලයින් කාඩ්පත් ලෙස පෙන්වීම */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {lines.map((line) => (
          <div
            key={line.id}
            onClick={() => router.push(`/Supervisor/${line.id}`)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg cursor-pointer transition-all transform hover:-translate-y-1"
          >
            <h2 className="text-xl font-bold text-blue-600 mb-2">{line.id}</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Product Code: <span className="font-semibold">{line.productCode}</span>
              </p>
              <p>Floor: {line.floor}</p>
              <p>Supervisor: {line.supervisor}</p>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-xs text-gray-400">Total Output</span>
              <span className="text-lg font-black text-gray-800">{line.totalProductCount || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
