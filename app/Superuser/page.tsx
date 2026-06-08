"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LineCard from "../components/Linecard";

interface Line {
  id: string;
  machineId?: string;
  productCode?: string;
  targetCount?: number;
  totalProductCount?: number;
}

export default function SuperuserDashboard() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  const fetchAllLines = useCallback(async () => {
    try {
      setError("");

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/esp32/all-lines`);

      const data = res.data?.data;

      if (data) {
        const linesArray: Line[] = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as Omit<Line, "id">),
        }));

        setLines(linesArray);
      } else {
        setLines([]);
      }
    } catch (err) {
      console.error("Error fetching lines:", err);
      setError("Failed to load production lines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllLines();

    const interval = setInterval(() => {
      fetchAllLines();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAllLines]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading Production Lines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Image src="/logo.png" alt="Flexicare Lanka" width={90} height={90} priority />

          <h1 className="text-4xl font-extrabold text-gray-900">Flexicare Lanka Production Dashboard</h1>
        </div>

        {/* Sub Header */}
        <h2 className="text-2xl font-bold text-gray-700 text-center mb-8">Active Production Lines</h2>

        {/* No Data */}
        {lines.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">No Production Lines Available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lines.map((line) => (
              <button key={line.id} onClick={() => router.push(`/Superuser/${line.id}`)} className="text-left cursor-pointer transition-transform hover:scale-105 focus:outline-none">
                <LineCard line={line.id} product={line.productCode || "N/A"} machine={line.machineId || "No Machine"} target={line.targetCount || 0} current={line.totalProductCount || 0} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
