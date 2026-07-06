"use client";

import { LayoutDashboard, Activity, Clock3, Target, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../../lib/api";
import ProductionTable from "../components/ProductionTable";

// ===============================================
// DATA TYPES
// ===============================================
interface LineData {
  machineId: string;
  productCode: string;
  plannedMembers: number;
  hourlyTarget: number;
}

interface ChartDataPoint {
  time: string;
  target: number;
  actual: number;
  efficiency: number;
}

interface ProductDistribution {
  name: string;
  value: number;
  code: string;
  percentage?: number;
}

// ===============================================
// COLORS & STYLING
// ===============================================
const COLORS = {
  primary: "#2563eb",
  success: "#16a34a",
  warning: "#ea580c",
  danger: "#dc2626",
  purple: "#9333ea",
  cyan: "#06b6d4",
};

const chartColors = [
  "#2563eb", // blue
  "#9333ea", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#10b981", // emerald
];

// ===============================================
// MOCK DATA GENERATOR
// ===============================================
const generateChartData = (): ChartDataPoint[] => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  return hours.map((hour) => ({
    time: `${hour}:00`,
    target: 850 + Math.random() * 200,
    actual: 820 + Math.random() * 250,
    efficiency: 85 + Math.random() * 15,
  }));
};

const generateProductDistribution = (): ProductDistribution[] => {
  const products = [
    { name: "Product A", value: 2500, code: "032-0025-1025" },
    { name: "Product B", value: 1800, code: "032-0025-1102" },
    { name: "Product C", value: 1200, code: "032-002-0040" },
  ];

  const total = products.reduce((sum, p) => sum + p.value, 0);

  return products.map((p) => ({
    ...p,
    percentage: Math.round((p.value / total) * 100),
  }));
};

// ===============================================
// STAT CARD COMPONENT
// ===============================================
interface StatCardProps {
  icon: React.ComponentType<{ size: number; className: string }>;
  label: string;
  value: string | number;
  trend?: string;
  color?: "blue" | "green" | "orange" | "purple";
}

const StatCard = ({ icon: Icon, label, value, trend, color = "blue" }: StatCardProps) => {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "bg-blue-100" },
    green: { bg: "bg-green-50", text: "text-green-600", icon: "bg-green-100" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "bg-orange-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "bg-purple-100" },
  };

  const theme = colorMap[color];

  return (
    <div className={`${theme.bg} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <h3 className={`text-4xl font-bold ${theme.text} mt-3`}>{value}</h3>
          {trend && <p className="text-xs text-gray-500 mt-2">{trend}</p>}
        </div>
        <div className={`${theme.icon} p-4 rounded-2xl`}>
          <Icon className={`${theme.text}`} size={32} />
        </div>
      </div>
    </div>
  );
};

// ===============================================
// DASHBOARD PAGE
// ===============================================
export default function Dashboard() {
  // ===========================================
  // STATES
  // ===========================================
  const [lines, setLines] = useState<Record<string, LineData>>({});
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
  const [currentShift, setCurrentShift] = useState("");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [productDistribution, setProductDistribution] = useState<ProductDistribution[]>([]);
  const [overallEfficiency, setOverallEfficiency] = useState(0);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // ===========================================
  // DATA FETCHING
  // ===========================================
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const linesRes = await api.get(`/api/lines`);
        const linesData = linesRes.data.data || linesRes.data;

        if (!linesData) {
          if (isMounted) setLines({});
          return;
        }

        if (isMounted) setLines(linesData);

        const counts: Record<string, number> = {};
        const countPromises = Object.values(linesData).map(async (lineValue: unknown) => {
          const line = lineValue as LineData;
          const machineId = line.machineId;

          try {
            const res = await api.get(`/api/esp32/${machineId}/total-output`);
            if (res.data && res.data.success) {
              counts[machineId] = res.data.totalOutput || 0;
            }
          } catch (error) {
            console.error(`Error fetching count for ${machineId}:`, error);
          }
        });

        await Promise.all(countPromises);
        if (isMounted) {
          setLiveCounts(counts);
        }

        // Generate chart and distribution data
        const newChartData = generateChartData();
        const newProductDistribution = generateProductDistribution();

        if (isMounted) {
          setChartData(newChartData);
          setProductDistribution(newProductDistribution);

          // Calculate overall efficiency
          const avgEfficiency = newChartData.reduce((sum, point) => sum + point.efficiency, 0) / newChartData.length;
          setOverallEfficiency(Math.round(avgEfficiency));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [API_BASE_URL]);

  // ===========================================
  // SHIFT TIMING
  // ===========================================
  useEffect(() => {
    const updateShift = () => {
      const hour = new Date().getHours();
      setCurrentShift(hour >= 8 && hour < 20 ? "Day Shift" : "Night Shift");
    };

    updateShift();
    const interval = setInterval(updateShift, 60000);

    return () => clearInterval(interval);
  }, []);

  // ===========================================
  // CALCULATIONS
  // ===========================================
  const combinedLines = Object.entries(lines).map(([lineKey, line]) => ({
    ...line,
    lineKey,
  }));

  const totalLines = combinedLines.length;
  const totalTarget = combinedLines.reduce((sum, line) => sum + line.hourlyTarget, 0);
  const totalOutput = combinedLines.reduce((sum, line) => sum + (liveCounts[line.machineId] || 0), 0);
  const achievementRate = totalTarget > 0 ? Math.round((totalOutput / totalTarget) * 100) : 0;

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      {/* HEADER */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="bg-linear-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
            <LayoutDashboard className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Production Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time manufacturing analytics & monitoring</p>
          </div>
        </div>
      </div>

      {/* KEY METRICS - TOP ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Activity} label="Active Lines" value={totalLines} color="blue" />
        <StatCard icon={Target} label="Hourly Target" value={totalTarget} color="green" />
        <StatCard icon={Zap} label="Current Output" value={totalOutput} color="orange" />
        <StatCard icon={TrendingUp} label="Achievement Rate" value={`${achievementRate}%`} trend={achievementRate >= 90 ? "On target ✓" : "Below target"} color="purple" />
      </div>

      {/* SHIFT & EFFICIENCY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 md:col-span-1">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-4 rounded-xl">
              <Clock3 className="text-orange-600" size={28} />
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Shift</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{currentShift}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Line Efficiency</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{overallEfficiency}%</p>
            </div>
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{overallEfficiency}%</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle size={16} />
              <span>All lines operating within normal parameters</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Production Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">Production Trend</h2>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">+12% MoM</span>
            </div>
            <p className="text-sm text-gray-500">Hourly target vs actual production</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
              <Line type="monotone" dataKey="target" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary, r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="actual" stroke={COLORS.success} strokeWidth={3} dot={{ fill: COLORS.success, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Distribution</h2>
            <p className="text-sm text-gray-500 mt-1">By product code</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={productDistribution}
                cx="40%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ payload }) => {
                  const data = payload as ProductDistribution;
                  return `${data.code}\n${data.percentage}%`;
                }}
                labelLine={{
                  stroke: "#9ca3af",
                  strokeWidth: 1.5,
                }}
              >
                {productDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} units`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {productDistribution.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{product.code}</p>
                    <p className="text-xs text-gray-500">{product.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{product.percentage}%</p>
                  <p className="text-xs text-gray-500">{product.value} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Efficiency Over Time */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Line Efficiency</h2>
            <p className="text-sm text-gray-500 mt-1">Percentage by hour</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="efficiency" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance</h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uptime</span>
                <span className="text-sm font-bold text-gray-900">98.5%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "98.5%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Target Met</span>
                <span className="text-sm font-bold text-gray-900">92%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Quality Rate</span>
                <span className="text-sm font-bold text-gray-900">97%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "97%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Equipment Health</span>
                <span className="text-sm font-bold text-gray-900">95%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTION TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-linear-to-r from-gray-800 to-gray-900 text-white px-8 py-6">
          <h2 className="text-2xl font-bold">Production Lines Monitor</h2>
          <p className="text-gray-300 mt-1 text-sm">Real-time tracking by production line</p>
        </div>
        <div className="p-6">
          <ProductionTable linesData={combinedLines} />
        </div>
      </div>
    </div>
  );
}
