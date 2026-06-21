/* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import { useState, useMemo, useCallback } from "react";
// import { Factory, AlertCircle, CheckCircle2, TrendingUp, Zap, Search, Filter, Calendar, Package } from "lucide-react";

// // ====================================================================
// // TYPES & INTERFACES
// // ====================================================================

// interface Machine {
//   machineId: string;
//   machineName: string;
//   machineType: "Injection" | "Extruder";
//   productCode: string;
//   productName: string;
//   dailyTarget: number;
//   currentOutput: number;
//   shift: "Day" | "Night";
//   supervisor: string;
//   status: "online" | "offline" | "maintenance";
//   floor: string;
// }

// interface HourlyProduction {
//   hour: string;
//   production: number;
// }

// interface ProductionRow {
//   machineId: string;
//   machineName: string;
//   productName: string;
//   shift: string;
//   target: number;
//   output: number;
//   efficiency: number;
//   status: string;
//   supervisor: string;
// }

// // ====================================================================
// // MOCK DATA
// // ====================================================================

// const INJECTION_MACHINES: Machine[] = [
//   {
//     machineId: "INJ-001",
//     machineName: "Injection Machine 01",
//     machineType: "Injection",
//     productCode: "INJ-P001",
//     productName: "Medical Connector",
//     dailyTarget: 5000,
//     currentOutput: 4250,
//     shift: "Day",
//     supervisor: "Supervisor 01",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "INJ-002",
//     machineName: "Injection Machine 02",
//     machineType: "Injection",
//     productCode: "INJ-P002",
//     productName: "Mask Connector",
//     dailyTarget: 4500,
//     currentOutput: 3815,
//     shift: "Day",
//     supervisor: "Supervisor 02",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "INJ-003",
//     machineName: "Injection Machine 03",
//     machineType: "Injection",
//     productCode: "INJ-P003",
//     productName: "Y Connector",
//     dailyTarget: 6000,
//     currentOutput: 5280,
//     shift: "Night",
//     supervisor: "Supervisor 03",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "INJ-004",
//     machineName: "Injection Machine 04",
//     machineType: "Injection",
//     productCode: "INJ-P004",
//     productName: "Valve Housing",
//     dailyTarget: 4800,
//     currentOutput: 3945,
//     shift: "Day",
//     supervisor: "Supervisor 04",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "INJ-005",
//     machineName: "Injection Machine 05",
//     machineType: "Injection",
//     productCode: "INJ-P005",
//     productName: "Filter Cap",
//     dailyTarget: 5500,
//     currentOutput: 4890,
//     shift: "Day",
//     supervisor: "Supervisor 05",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "INJ-006",
//     machineName: "Injection Machine 06",
//     machineType: "Injection",
//     productCode: "INJ-P006",
//     productName: "Plastic Adapter",
//     dailyTarget: 5200,
//     currentOutput: 0,
//     shift: "Night",
//     supervisor: "Supervisor 06",
//     status: "offline",
//     floor: "Manufacturing Floor",
//   },
// ];

// const EXTRUDER_MACHINES: Machine[] = [
//   {
//     machineId: "EXT-001",
//     machineName: "Extruder Machine 01",
//     machineType: "Extruder",
//     productCode: "EXT-P001",
//     productName: "Corrugated Tube",
//     dailyTarget: 8000,
//     currentOutput: 6500,
//     shift: "Day",
//     supervisor: "Supervisor 07",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "EXT-002",
//     machineName: "Extruder Machine 02",
//     machineType: "Extruder",
//     productCode: "EXT-P002",
//     productName: "Flexilock Tube",
//     dailyTarget: 7500,
//     currentOutput: 5980,
//     shift: "Day",
//     supervisor: "Supervisor 08",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "EXT-003",
//     machineName: "Extruder Machine 03",
//     machineType: "Extruder",
//     productCode: "EXT-P003",
//     productName: "Flexible Tube",
//     dailyTarget: 6500,
//     currentOutput: 4310,
//     shift: "Night",
//     supervisor: "Supervisor 09",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "EXT-004",
//     machineName: "Extruder Machine 04",
//     machineType: "Extruder",
//     productCode: "EXT-P004",
//     productName: "PVC Tube",
//     dailyTarget: 9000,
//     currentOutput: 7440,
//     shift: "Day",
//     supervisor: "Supervisor 10",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "EXT-005",
//     machineName: "Extruder Machine 05",
//     machineType: "Extruder",
//     productCode: "EXT-P005",
//     productName: "PE Tubing",
//     dailyTarget: 7000,
//     currentOutput: 5620,
//     shift: "Night",
//     supervisor: "Supervisor 11",
//     status: "online",
//     floor: "Manufacturing Floor",
//   },
//   {
//     machineId: "EXT-006",
//     machineName: "Extruder Machine 06",
//     machineType: "Extruder",
//     productCode: "EXT-P006",
//     productName: "Medical Tube",
//     dailyTarget: 8500,
//     currentOutput: 0,
//     shift: "Night",
//     supervisor: "Supervisor 12",
//     status: "offline",
//     floor: "Manufacturing Floor",
//   },
// ];
// const ALL_MACHINES = [...INJECTION_MACHINES, ...EXTRUDER_MACHINES];

// const HOURLY_DATA: HourlyProduction[] = [
//   { hour: "08:00", production: 450 },
//   { hour: "09:00", production: 520 },
//   { hour: "10:00", production: 480 },
//   { hour: "11:00", production: 550 },
//   { hour: "12:00", production: 420 },
//   { hour: "13:00", production: 490 },
//   { hour: "14:00", production: 530 },
//   { hour: "15:00", production: 510 },
//   { hour: "16:00", production: 540 },
// ];

// // ====================================================================
// // INLINE COMPONENTS
// // ====================================================================

// // StatCard Component
// function StatCard({
//   label,
//   value,
//   icon: Icon,
//   trend,
//   color,
// }: {
//   label: string;
//   value: string | number;
//   icon: React.ComponentType<{ className: string }>;
//   trend?: string;
//   color: "blue" | "emerald" | "purple" | "orange" | "red";
// }) {
//   const colors = {
//     blue: "bg-blue-50 text-blue-600 border-blue-200",
//     emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
//     purple: "bg-purple-50 text-purple-600 border-purple-200",
//     orange: "bg-orange-50 text-orange-600 border-orange-200",
//     red: "bg-red-50 text-red-600 border-red-200",
//   };

//   return (
//     <div className={`rounded-lg border ${colors[color]} p-4 shadow-sm`}>
//       <div className="flex items-start justify-between">
//         <div>
//           <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
//           <p className="text-2xl font-bold">{value}</p>
//           {trend && <p className="text-xs mt-1 text-green-600">{trend}</p>}
//         </div>
//         <Icon className="w-8 h-8 opacity-60" />
//       </div>
//     </div>
//   );
// }

// // MachineCard Component
// function MachineCard({ machine, isSelected, onClick }: { machine: Machine; isSelected: boolean; onClick: () => void }) {
//   const efficiency = Math.round((machine.currentOutput / machine.dailyTarget) * 100);
//   const statusColor = machine.status === "online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
//   const typeColor = machine.machineType === "Injection" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";

//   return (
//     <div
//       onClick={onClick}
//       className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
//         isSelected ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-200 bg-white hover:shadow-md hover:border-gray-300"
//       }`}
//     >
//       <div className="flex justify-between items-start mb-2">
//         <div>
//           <h3 className="font-bold text-sm text-gray-800">{machine.machineName}</h3>
//           <p className="text-xs text-gray-600">{machine.productName}</p>
//         </div>
//         <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor}`}>{machine.status === "online" ? "Online" : "Offline"}</span>
//       </div>

//       <div className="mb-3">
//         <div className="flex justify-between items-center mb-1">
//           <span className="text-xs text-gray-600">Progress</span>
//           <span className="text-sm font-bold text-gray-800">{efficiency}%</span>
//         </div>
//         <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
//           <div
//             className={`h-full transition-all duration-300 ${efficiency >= 80 ? "bg-green-500" : efficiency >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
//             style={{ width: `${Math.min(efficiency, 100)}%` }}
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-2">
//         <div className="bg-gray-50 p-2 rounded">
//           <p className="text-xs text-gray-600">Target</p>
//           <p className="font-bold text-sm text-gray-800">{machine.dailyTarget.toLocaleString()}</p>
//         </div>
//         <div className="bg-gray-50 p-2 rounded">
//           <p className="text-xs text-gray-600">Output</p>
//           <p className="font-bold text-sm text-gray-800">{machine.currentOutput.toLocaleString()}</p>
//         </div>
//       </div>

//       <div className="mt-2 flex gap-1">
//         <span className={`text-xs font-semibold px-2 py-1 rounded ${typeColor}`}>{machine.machineType}</span>
//         <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">{machine.shift}</span>
//       </div>
//     </div>
//   );
// }

// // MachineOverview Component
// function MachineOverview({ machine }: { machine: Machine | null }) {
//   if (!machine) {
//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
//         <p className="text-gray-500">Select a machine to view details</p>
//       </div>
//     );
//   }

//   const efficiency = Math.round((machine.currentOutput / machine.dailyTarget) * 100);
//   const remaining = Math.max(0, machine.dailyTarget - machine.currentOutput);

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6">
//       <div className="flex justify-between items-start mb-6">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800">{machine.machineName}</h2>
//           <p className="text-gray-600 mt-1">{machine.productName}</p>
//         </div>
//         <span className={`px-4 py-2 rounded-full font-semibold ${machine.status === "online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//           {machine.status === "online" ? "🟢 Online" : "🔴 Offline"}
//         </span>
//       </div>

//       <div className="grid grid-cols-4 gap-4 mb-6">
//         <div className="bg-blue-50 rounded-lg p-4">
//           <p className="text-xs text-gray-600 mb-1">Daily Target</p>
//           <p className="text-2xl font-bold text-blue-600">{machine.dailyTarget.toLocaleString()}</p>
//         </div>
//         <div className="bg-purple-50 rounded-lg p-4">
//           <p className="text-xs text-gray-600 mb-1">Current Output</p>
//           <p className="text-2xl font-bold text-purple-600">{machine.currentOutput.toLocaleString()}</p>
//         </div>
//         <div className="bg-orange-50 rounded-lg p-4">
//           <p className="text-xs text-gray-600 mb-1">Remaining</p>
//           <p className="text-2xl font-bold text-orange-600">{remaining.toLocaleString()}</p>
//         </div>
//         <div className="bg-emerald-50 rounded-lg p-4">
//           <p className="text-xs text-gray-600 mb-1">Efficiency</p>
//           <p className="text-2xl font-bold text-emerald-600">{efficiency}%</p>
//         </div>
//       </div>

//       <div className="mb-6">
//         <div className="flex justify-between mb-2">
//           <span className="text-sm font-semibold text-gray-700">Production Progress</span>
//           <span className="text-sm text-gray-600">{efficiency}% of target</span>
//         </div>
//         <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
//           <div
//             className={`h-full transition-all duration-300 ${efficiency >= 80 ? "bg-green-500" : efficiency >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
//             style={{ width: `${Math.min(efficiency, 100)}%` }}
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
//         <div>
//           <p className="text-xs text-gray-600 mb-1">Supervisor</p>
//           <p className="font-semibold text-gray-800">{machine.supervisor}</p>
//         </div>
//         <div>
//           <p className="text-xs text-gray-600 mb-1">Shift</p>
//           <p className="font-semibold text-gray-800">{machine.shift}</p>
//         </div>
//         <div>
//           <p className="text-xs text-gray-600 mb-1">Floor</p>
//           <p className="font-semibold text-gray-800">{machine.floor}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ProductionTable Component
// function ProductionTable({ machines }: { machines: Machine[] }) {
//   const rows: ProductionRow[] = machines.map((m) => ({
//     machineId: m.machineId,
//     machineName: m.machineName,
//     productName: m.productName,
//     shift: m.shift,
//     target: m.dailyTarget,
//     output: m.currentOutput,
//     efficiency: Math.round((m.currentOutput / m.dailyTarget) * 100),
//     status: m.status === "online" ? "Online" : "Offline",
//     supervisor: m.supervisor,
//   }));

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 border-b border-gray-200">
//             <tr>
//               <th className="px-4 py-3 text-left font-semibold text-gray-700">Machine</th>
//               <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
//               <th className="px-4 py-3 text-left font-semibold text-gray-700">Shift</th>
//               <th className="px-4 py-3 text-right font-semibold text-gray-700">Target</th>
//               <th className="px-4 py-3 text-right font-semibold text-gray-700">Output</th>
//               <th className="px-4 py-3 text-center font-semibold text-gray-700">Efficiency</th>
//               <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
//               <th className="px-4 py-3 text-left font-semibold text-gray-700">Supervisor</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((row) => (
//               <tr key={row.machineId} className="border-b border-gray-100 hover:bg-gray-50">
//                 <td className="px-4 py-3 font-medium text-gray-800">{row.machineName}</td>
//                 <td className="px-4 py-3 text-gray-700">{row.productName}</td>
//                 <td className="px-4 py-3 text-gray-700">{row.shift}</td>
//                 <td className="px-4 py-3 text-right text-gray-700">{row.target.toLocaleString()}</td>
//                 <td className="px-4 py-3 text-right font-semibold text-gray-800">{row.output.toLocaleString()}</td>
//                 <td className="px-4 py-3 text-center">
//                   <span
//                     className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
//                       row.efficiency >= 80 ? "bg-green-100 text-green-700" : row.efficiency >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
//                     }`}
//                   >
//                     {row.efficiency}%
//                   </span>
//                 </td>
//                 <td className="px-4 py-3 text-center">
//                   <span
//                     className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${row.status === "Online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
//                   >
//                     {row.status === "Online" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
//                     {row.status}
//                   </span>
//                 </td>
//                 <td className="px-4 py-3 text-gray-700">{row.supervisor}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// // CumulativeChart Component
// function CumulativeChart({ machines }: { machines: Machine[] }) {
//   const totalOutput = machines.reduce((sum, m) => sum + m.currentOutput, 0);
//   const totalTarget = machines.reduce((sum, m) => sum + m.dailyTarget, 0);

//   const cumulativeData = [
//     { time: "08:00", cumulative: 450 },
//     { time: "09:00", cumulative: 970 },
//     { time: "10:00", cumulative: 1450 },
//     { time: "11:00", cumulative: 2000 },
//     { time: "12:00", cumulative: 2420 },
//     { time: "13:00", cumulative: 2910 },
//     { time: "14:00", cumulative: 3440 },
//     { time: "15:00", cumulative: 3950 },
//     { time: "16:00", cumulative: 4490 },
//   ];

//   const maxCumulative = Math.max(...cumulativeData.map((d) => d.cumulative));

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6">
//       <h3 className="text-lg font-bold text-gray-800 mb-6">Cumulative Production</h3>

//       <div className="flex items-end justify-around gap-2 h-64 py-4 px-2 bg-gray-50 rounded-lg">
//         {cumulativeData.map((item, idx) => {
//           const barHeight = (item.cumulative / maxCumulative) * 100;

//           return (
//             <div key={idx} className="flex-1 flex flex-col items-center gap-2">
//               <div className="relative w-full h-56 flex items-end justify-center">
//                 <div
//                   className="w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 hover:shadow-lg"
//                   style={{ height: `${barHeight}%` }}
//                   title={`${item.cumulative} units`}
//                 />
//               </div>
//               <p className="text-xs text-gray-600 text-center font-semibold">{item.time}</p>
//               <p className="text-xs font-bold text-gray-800">{item.cumulative}</p>
//             </div>
//           );
//         })}
//       </div>

//       <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
//         <div className="flex justify-between items-center">
//           <div>
//             <p className="text-xs text-gray-600 mb-1">Total Output vs Target</p>
//             <p className="text-lg font-bold text-blue-600">
//               {totalOutput.toLocaleString()} / {totalTarget.toLocaleString()}
//             </p>
//           </div>
//           <div className="text-right">
//             <p className="text-xs text-gray-600 mb-1">Efficiency</p>
//             <p className="text-lg font-bold text-blue-600">{Math.round((totalOutput / totalTarget) * 100)}%</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // HourlyChart Component
// function HourlyChart() {
//   const maxProduction = Math.max(...HOURLY_DATA.map((d) => d.production));

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6">
//       <h3 className="text-lg font-bold text-gray-800 mb-6">Hourly Production</h3>

//       <div className="flex items-end justify-around gap-2 h-64 py-4 px-2 bg-gray-50 rounded-lg">
//         {HOURLY_DATA.map((item, idx) => {
//           const barHeight = (item.production / maxProduction) * 100;

//           return (
//             <div key={idx} className="flex-1 flex flex-col items-center gap-2">
//               <div className="relative w-full h-56 flex items-end justify-center">
//                 <div
//                   className="w-full bg-linear-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-300 hover:from-purple-600 hover:to-purple-500 hover:shadow-lg"
//                   style={{ height: `${barHeight}%` }}
//                   title={`${item.production} units`}
//                 />
//               </div>
//               <p className="text-xs text-gray-600 text-center font-semibold">{item.hour}</p>
//               <p className="text-xs font-bold text-gray-800">{item.production}</p>
//             </div>
//           );
//         })}
//       </div>

//       <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
//         <div className="flex justify-between items-center">
//           <div>
//             <p className="text-xs text-gray-600 mb-1">Average Hourly Output</p>
//             <p className="text-lg font-bold text-purple-600">{Math.round(HOURLY_DATA.reduce((sum, d) => sum + d.production, 0) / HOURLY_DATA.length)}</p>
//           </div>
//           <div className="text-right">
//             <p className="text-xs text-gray-600 mb-1">Peak Hour</p>
//             <p className="text-lg font-bold text-purple-600">{HOURLY_DATA.reduce((max, d) => (d.production > max.production ? d : max)).hour}</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // GapAnalysis Component
// function GapAnalysis({ machines }: { machines: Machine[] }) {
//   const gaps = machines.map((m) => ({
//     name: m.machineName,
//     target: m.dailyTarget,
//     actual: m.currentOutput,
//     gap: m.currentOutput - m.dailyTarget,
//   }));

//   const maxGap = Math.max(...gaps.map((g) => Math.abs(g.gap)));

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6">
//       <h3 className="text-lg font-bold text-gray-800 mb-6">Production Gap Analysis</h3>

//       <div className="space-y-3">
//         {gaps.map((gap, idx) => {
//           const gapPercentage = (Math.abs(gap.gap) / maxGap) * 100;
//           const isPositive = gap.gap >= 0;

//           return (
//             <div key={idx} className="flex items-center gap-3">
//               <p className="text-xs font-semibold text-gray-700 w-32 truncate">{gap.name}</p>
//               <div className="flex-1">
//                 <div className="flex gap-1 h-6 items-center bg-gray-50 rounded p-1">
//                   {!isPositive && <div className="bg-red-500 rounded-l transition-all duration-300" style={{ width: `${gapPercentage}%` }} />}
//                   {isPositive && <div className="bg-green-500 rounded-r transition-all duration-300 ml-auto" style={{ width: `${gapPercentage}%` }} />}
//                 </div>
//               </div>
//               <p className={`text-xs font-bold w-16 text-right ${isPositive ? "text-green-600" : "text-red-600"}`}>
//                 {isPositive ? "+" : ""}
//                 {gap.gap.toLocaleString()}
//               </p>
//             </div>
//           );
//         })}
//       </div>

//       <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
//         <div className="p-3 bg-green-50 rounded-lg border border-green-200">
//           <p className="text-xs text-gray-600 mb-1">Total Gain</p>
//           <p className="text-lg font-bold text-green-600">
//             {gaps
//               .filter((g) => g.gap > 0)
//               .reduce((sum, g) => sum + g.gap, 0)
//               .toLocaleString()}
//           </p>
//         </div>
//         <div className="p-3 bg-red-50 rounded-lg border border-red-200">
//           <p className="text-xs text-gray-600 mb-1">Total Gap</p>
//           <p className="text-lg font-bold text-red-600">{Math.abs(gaps.filter((g) => g.gap < 0).reduce((sum, g) => sum + g.gap, 0)).toLocaleString()}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ====================================================================
// // MAIN DASHBOARD COMPONENT
// // ====================================================================

// export default function ManufacturingDashboard() {
//   const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [machineFilter, setMachineFilter] = useState<"all" | "injection" | "extruder">("all");
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

//   // Filter machines based on search and type
//   const filteredMachines = useMemo(() => {
//     return ALL_MACHINES.filter((machine) => {
//       const matchesSearch = machine.machineName.toLowerCase().includes(searchQuery.toLowerCase()) || machine.productName.toLowerCase().includes(searchQuery.toLowerCase());

//       const matchesFilter = machineFilter === "all" || (machineFilter === "injection" && machine.machineType === "Injection") || (machineFilter === "extruder" && machine.machineType === "Extruder");

//       return matchesSearch && matchesFilter;
//     });
//   }, [searchQuery, machineFilter]);

//   // Calculate statistics
//   const stats = useMemo(() => {
//     const total = ALL_MACHINES.length;
//     const online = ALL_MACHINES.filter((m) => m.status === "online").length;
//     const offline = total - online;
//     const totalProduction = ALL_MACHINES.reduce((sum, m) => sum + m.currentOutput, 0);
//     const totalTarget = ALL_MACHINES.reduce((sum, m) => sum + m.dailyTarget, 0);
//     const efficiency = Math.round((totalProduction / totalTarget) * 100);

//     return { total, online, offline, totalProduction, totalTarget, efficiency };
//   }, []);

//   const handleMachineSelect = useCallback((machine: Machine) => {
//     setSelectedMachine(machine);
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-between mb-2">
//             <div className="flex items-center gap-3">
//               <Factory className="w-8 h-8" />
//               <h1 className="text-3xl font-bold">Manufacturing Dashboard</h1>
//             </div>
//             <div className="text-sm text-gray-300">
//               {new Date().toLocaleDateString("en-US", {
//                 weekday: "long",
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               })}
//             </div>
//           </div>
//           <p className="text-gray-400">
//             Development Notice This Manufacturing Dashboard is currently running with mock data for demonstration, testing, and user interface development purposes. Real-time production data, machine
//             communication, database integration, device logs, historical tracking, reporting modules, and analytics features are currently under development and will be integrated in future versions
//             of the system. The data displayed on this dashboard should not be used for operational or production decision-making until live system integration is completed.
//           </p>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto p-6 space-y-6">
//         {/* Summary Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//           <StatCard label="Total Machines" value={stats.total} icon={Factory} color="blue" />
//           <StatCard label="Online Machines" value={stats.online} icon={Zap} color="emerald" />
//           <StatCard label="Offline Machines" value={stats.offline} icon={AlertCircle} color="red" />
//           <StatCard label="Total Production" value={stats.totalProduction.toLocaleString()} icon={TrendingUp} color="purple" />
//           <StatCard label="Daily Target" value={stats.totalTarget.toLocaleString()} icon={Package} color="orange" />
//           <StatCard label="Efficiency" value={`${stats.efficiency}%`} icon={CheckCircle2} color="emerald" />
//         </div>

//         {/* Filters and Search */}
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search machines..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             {/* Machine Type Filter */}
//             <div className="flex gap-2">
//               <Filter className="w-5 h-5 text-gray-600 mt-2" />
//               <select
//                 value={machineFilter}
//                 onChange={(e) => setMachineFilter(e.target.value as "all" | "injection" | "extruder")}
//                 className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="all">All Machines</option>
//                 <option value="injection">Injection Machines</option>
//                 <option value="extruder">Extruder Machines</option>
//               </select>
//             </div>

//             {/* Date Filter */}
//             <div className="flex gap-2">
//               <Calendar className="w-5 h-5 text-gray-600 mt-2" />
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Machine Cards Grid and Overview */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Machine Cards */}
//           <div className="lg:col-span-1">
//             <h2 className="text-lg font-bold text-gray-800 mb-4">Machines ({filteredMachines.length})</h2>
//             <div className="space-y-3 max-h-96 overflow-y-auto">
//               {filteredMachines.map((machine) => (
//                 <MachineCard key={machine.machineId} machine={machine} isSelected={selectedMachine?.machineId === machine.machineId} onClick={() => handleMachineSelect(machine)} />
//               ))}
//             </div>
//           </div>

//           {/* Machine Overview */}
//           <div className="lg:col-span-2">
//             <h2 className="text-lg font-bold text-gray-800 mb-4">Machine Overview</h2>
//             <MachineOverview machine={selectedMachine} />
//           </div>
//         </div>

//         {/* Production Table */}
//         <div>
//           <h2 className="text-lg font-bold text-gray-800 mb-4">Production Details</h2>
//           <ProductionTable machines={filteredMachines} />
//         </div>

//         {/* Charts Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <CumulativeChart machines={ALL_MACHINES} />
//           <HourlyChart />
//         </div>

//         {/* Gap Analysis */}
//         <div>
//           <h2 className="text-lg font-bold text-gray-800 mb-4">Gap Analysis</h2>
//           <GapAnalysis machines={ALL_MACHINES} />
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { Factory, AlertCircle, CheckCircle2, TrendingUp, Zap, Search, Filter, Calendar, Package, Activity, Cpu, BarChart3, ChevronRight } from "lucide-react";

// ====================================================================
// TYPES & INTERFACES
// ====================================================================

interface Machine {
  machineId: string;
  machineName: string;
  machineType: "Injection" | "Extruder";
  productCode: string;
  productName: string;
  dailyTarget: number;
  currentOutput: number;
  shift: "Day" | "Night";
  supervisor: string;
  status: "online" | "offline" | "maintenance";
  floor: string;
}

interface HourlyProduction {
  hour: string;
  production: number;
}

interface ProductionRow {
  machineId: string;
  machineName: string;
  productName: string;
  shift: string;
  target: number;
  output: number;
  efficiency: number;
  status: string;
  supervisor: string;
  machineType: string;
}

// ====================================================================
// MOCK DATA
// ====================================================================

const INJECTION_MACHINES: Machine[] = [
  {
    machineId: "INJ-001",
    machineName: "Injection Machine 01",
    machineType: "Injection",
    productCode: "INJ-P001",
    productName: "Medical Connector",
    dailyTarget: 5000,
    currentOutput: 4250,
    shift: "Day",
    supervisor: "Supervisor 01",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "INJ-002",
    machineName: "Injection Machine 02",
    machineType: "Injection",
    productCode: "INJ-P002",
    productName: "Mask Connector",
    dailyTarget: 4500,
    currentOutput: 3815,
    shift: "Day",
    supervisor: "Supervisor 02",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "INJ-003",
    machineName: "Injection Machine 03",
    machineType: "Injection",
    productCode: "INJ-P003",
    productName: "Y Connector",
    dailyTarget: 6000,
    currentOutput: 5280,
    shift: "Night",
    supervisor: "Supervisor 03",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "INJ-004",
    machineName: "Injection Machine 04",
    machineType: "Injection",
    productCode: "INJ-P004",
    productName: "Valve Housing",
    dailyTarget: 4800,
    currentOutput: 3945,
    shift: "Day",
    supervisor: "Supervisor 04",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "INJ-005",
    machineName: "Injection Machine 05",
    machineType: "Injection",
    productCode: "INJ-P005",
    productName: "Filter Cap",
    dailyTarget: 5500,
    currentOutput: 4890,
    shift: "Day",
    supervisor: "Supervisor 05",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "INJ-006",
    machineName: "Injection Machine 06",
    machineType: "Injection",
    productCode: "INJ-P006",
    productName: "Plastic Adapter",
    dailyTarget: 5200,
    currentOutput: 0,
    shift: "Night",
    supervisor: "Supervisor 06",
    status: "offline",
    floor: "Manufacturing Floor",
  },
];

const EXTRUDER_MACHINES: Machine[] = [
  {
    machineId: "EXT-001",
    machineName: "Extruder Machine 01",
    machineType: "Extruder",
    productCode: "EXT-P001",
    productName: "Corrugated Tube",
    dailyTarget: 8000,
    currentOutput: 6500,
    shift: "Day",
    supervisor: "Supervisor 07",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "EXT-002",
    machineName: "Extruder Machine 02",
    machineType: "Extruder",
    productCode: "EXT-P002",
    productName: "Flexilock Tube",
    dailyTarget: 7500,
    currentOutput: 5980,
    shift: "Day",
    supervisor: "Supervisor 08",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "EXT-003",
    machineName: "Extruder Machine 03",
    machineType: "Extruder",
    productCode: "EXT-P003",
    productName: "Flexible Tube",
    dailyTarget: 6500,
    currentOutput: 4310,
    shift: "Night",
    supervisor: "Supervisor 09",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "EXT-004",
    machineName: "Extruder Machine 04",
    machineType: "Extruder",
    productCode: "EXT-P004",
    productName: "PVC Tube",
    dailyTarget: 9000,
    currentOutput: 7440,
    shift: "Day",
    supervisor: "Supervisor 10",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "EXT-005",
    machineName: "Extruder Machine 05",
    machineType: "Extruder",
    productCode: "EXT-P005",
    productName: "PE Tubing",
    dailyTarget: 7000,
    currentOutput: 5620,
    shift: "Night",
    supervisor: "Supervisor 11",
    status: "online",
    floor: "Manufacturing Floor",
  },
  {
    machineId: "EXT-006",
    machineName: "Extruder Machine 06",
    machineType: "Extruder",
    productCode: "EXT-P006",
    productName: "Medical Tube",
    dailyTarget: 8500,
    currentOutput: 0,
    shift: "Night",
    supervisor: "Supervisor 12",
    status: "offline",
    floor: "Manufacturing Floor",
  },
];

const ALL_MACHINES = [...INJECTION_MACHINES, ...EXTRUDER_MACHINES];

const HOURLY_DATA: HourlyProduction[] = [
  { hour: "08:00", production: 450 },
  { hour: "09:00", production: 520 },
  { hour: "10:00", production: 480 },
  { hour: "11:00", production: 550 },
  { hour: "12:00", production: 420 },
  { hour: "13:00", production: 490 },
  { hour: "14:00", production: 530 },
  { hour: "15:00", production: 510 },
  { hour: "16:00", production: 540 },
];

// ====================================================================
// RADIAL PROGRESS RING (Signature Element)
// ====================================================================

function RadialRing({ efficiency, size = 72, strokeWidth = 6 }: { efficiency: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(efficiency / 100, 1);
  const dashOffset = circumference * (1 - progress);

  const color = efficiency >= 80 ? "#10B981" : efficiency >= 60 ? "#F59E0B" : efficiency === 0 ? "#EF4444" : "#EF4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
      />
    </svg>
  );
}

// ====================================================================
// STAT CARD
// ====================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  accent: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent,
          borderRadius: "12px 12px 0 0",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: accent, opacity: 0.7 }}>
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{sub}</span>}
    </div>
  );
}

// ====================================================================
// MACHINE CARD
// ====================================================================

function MachineCard({ machine, isSelected, onClick }: { machine: Machine; isSelected: boolean; onClick: () => void }) {
  const efficiency = machine.status === "offline" ? 0 : Math.round((machine.currentOutput / machine.dailyTarget) * 100);
  const isOnline = machine.status === "online";
  const typeAccent = machine.machineType === "Injection" ? "#6366F1" : "#8B5CF6";

  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        cursor: "pointer",
        border: isSelected ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.07)",
        background: isSelected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.025)",
        display: "flex",
        gap: 14,
        alignItems: "center",
        transition: "all 0.2s ease",
        position: "relative",
      }}
    >
      {/* Ring */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <RadialRing efficiency={efficiency} size={56} strokeWidth={5} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: efficiency >= 80 ? "#10B981" : efficiency >= 60 ? "#F59E0B" : "#EF4444",
          }}
        >
          {efficiency}%
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{machine.machineName}</span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>{machine.productName}</span>
        <div style={{ display: "flex", gap: 5 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 4,
              background: typeAccent + "22",
              color: typeAccent,
              letterSpacing: "0.04em",
            }}
          >
            {machine.machineType.toUpperCase()}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 4,
              background: isOnline ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              color: isOnline ? "#10B981" : "#EF4444",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: isOnline ? "#10B981" : "#EF4444",
                display: "inline-block",
                boxShadow: isOnline ? "0 0 6px #10B981" : "none",
              }}
            />
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <ChevronRight size={14} style={{ color: isSelected ? "#6366F1" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
    </div>
  );
}

// ====================================================================
// MACHINE OVERVIEW PANEL
// ====================================================================

function MachineOverview({ machine }: { machine: Machine | null }) {
  if (!machine) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.1)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          gap: 12,
          color: "rgba(255,255,255,0.25)",
        }}
      >
        <Cpu size={36} strokeWidth={1} />
        <span style={{ fontSize: 14 }}>Select a machine to inspect</span>
      </div>
    );
  }

  const efficiency = machine.status === "offline" ? 0 : Math.round((machine.currentOutput / machine.dailyTarget) * 100);
  const remaining = Math.max(0, machine.dailyTarget - machine.currentOutput);
  const isOnline = machine.status === "online";

  const metrics = [
    { label: "Daily Target", value: machine.dailyTarget.toLocaleString(), accent: "#6366F1" },
    { label: "Current Output", value: machine.currentOutput.toLocaleString(), accent: "#8B5CF6" },
    { label: "Remaining", value: remaining.toLocaleString(), accent: "#F59E0B" },
    { label: "Efficiency", value: `${efficiency}%`, accent: efficiency >= 80 ? "#10B981" : efficiency >= 60 ? "#F59E0B" : "#EF4444" },
  ];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 28,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", margin: 0, letterSpacing: "-0.03em" }}>{machine.machineName}</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "4px 0 0 0" }}>
            {machine.productCode} · {machine.productName}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: isOnline ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              color: isOnline ? "#10B981" : "#EF4444",
              border: `1px solid ${isOnline ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isOnline ? "#10B981" : "#EF4444",
                boxShadow: isOnline ? "0 0 8px #10B981" : "none",
              }}
            />
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{machine.shift} Shift</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>{m.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: m.accent, margin: 0, fontVariantNumeric: "tabular-nums" }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Production Progress</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{efficiency}% of daily target</span>
        </div>
        <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(efficiency, 100)}%`,
              background: efficiency >= 80 ? "linear-gradient(90deg,#059669,#10B981)" : efficiency >= 60 ? "linear-gradient(90deg,#D97706,#F59E0B)" : "linear-gradient(90deg,#DC2626,#EF4444)",
              borderRadius: 99,
              transition: "width 0.6s ease",
              boxShadow: efficiency >= 80 ? "0 0 10px rgba(16,185,129,0.4)" : "none",
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {[
          { label: "Supervisor", value: machine.supervisor },
          { label: "Shift", value: machine.shift },
          { label: "Floor", value: machine.floor },
        ].map((item) => (
          <div key={item.label}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>{item.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================================================================
// PRODUCTION TABLE
// ====================================================================

function ProductionTable({ machines }: { machines: Machine[] }) {
  const rows: ProductionRow[] = machines.map((m) => ({
    machineId: m.machineId,
    machineName: m.machineName,
    productName: m.productName,
    shift: m.shift,
    target: m.dailyTarget,
    output: m.currentOutput,
    efficiency: Math.round((m.currentOutput / m.dailyTarget) * 100),
    status: m.status === "online" ? "Online" : "Offline",
    supervisor: m.supervisor,
    machineType: m.machineType,
  }));

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Machine", "Product", "Type", "Shift", "Target", "Output", "Efficiency", "Status", "Supervisor"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "14px 16px",
                    textAlign: h === "Target" || h === "Output" ? "right" : h === "Efficiency" || h === "Status" ? "center" : "left",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    background: "rgba(255,255,255,0.03)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.machineId}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                }}
              >
                <td style={{ padding: "13px 16px", fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap" }}>{row.machineName}</td>
                <td style={{ padding: "13px 16px", color: "rgba(255,255,255,0.55)" }}>{row.productName}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: row.machineType === "Injection" ? "rgba(99,102,241,0.2)" : "rgba(139,92,246,0.2)",
                      color: row.machineType === "Injection" ? "#818CF8" : "#A78BFA",
                    }}
                  >
                    {row.machineType.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "13px 16px", color: "rgba(255,255,255,0.5)" }}>{row.shift}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums" }}>{row.target.toLocaleString()}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontWeight: 700, color: "#E2E8F0", fontVariantNumeric: "tabular-nums" }}>{row.output.toLocaleString()}</td>
                <td style={{ padding: "13px 16px", textAlign: "center" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: row.efficiency >= 80 ? "rgba(16,185,129,0.15)" : row.efficiency >= 60 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                      color: row.efficiency >= 80 ? "#10B981" : row.efficiency >= 60 ? "#F59E0B" : "#EF4444",
                    }}
                  >
                    {row.efficiency}%
                  </span>
                </td>
                <td style={{ padding: "13px 16px", textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: row.status === "Online" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                      color: row.status === "Online" ? "#10B981" : "#EF4444",
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", boxShadow: row.status === "Online" ? "0 0 6px currentColor" : "none" }} />
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: "13px 16px", color: "rgba(255,255,255,0.45)" }}>{row.supervisor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====================================================================
// BAR CHART (shared)
// ====================================================================

function BarChart({ data, color, label }: { data: { label: string; value: number; subValue?: string }[]; color: string; label: string }) {
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 24,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#E2E8F0", margin: "0 0 20px 0", letterSpacing: "-0.01em" }}>{label}</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, paddingBottom: 8 }}>
        {data.map((item, i) => {
          const heightPct = (item.value / max) * 100;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
              <div
                style={{
                  width: "100%",
                  background: color,
                  borderRadius: "4px 4px 0 0",
                  height: `${heightPct}%`,
                  minHeight: 4,
                  opacity: 0.85,
                  boxShadow: `0 0 12px ${color}55`,
                  transition: "height 0.4s ease",
                }}
              />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", fontWeight: 600 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====================================================================
// GAP ANALYSIS
// ====================================================================

function GapAnalysis({ machines }: { machines: Machine[] }) {
  const gaps = machines.map((m) => ({
    name: m.machineName.replace("Machine ", ""),
    gap: m.currentOutput - m.dailyTarget,
  }));

  const maxAbs = Math.max(...gaps.map((g) => Math.abs(g.gap)));

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 24,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#E2E8F0", margin: "0 0 20px 0", letterSpacing: "-0.01em" }}>Production Gap Analysis</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {gaps.map((g, i) => {
          const pct = (Math.abs(g.gap) / maxAbs) * 100;
          const isNeg = g.gap < 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", width: 110, flexShrink: 0, fontWeight: 600 }}>{g.name}</span>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: isNeg ? "#EF4444" : "#10B981",
                    borderRadius: 99,
                    marginLeft: isNeg ? "auto" : 0,
                    boxShadow: isNeg ? "none" : "0 0 8px rgba(16,185,129,0.4)",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: isNeg ? "#EF4444" : "#10B981", width: 60, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {isNeg ? "" : "+"}
                {g.gap.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 16px" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>Total Surplus</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#10B981", margin: 0 }}>
            +
            {gaps
              .filter((g) => g.gap > 0)
              .reduce((s, g) => s + g.gap, 0)
              .toLocaleString()}
          </p>
        </div>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>Total Shortfall</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#EF4444", margin: 0 }}>-{Math.abs(gaps.filter((g) => g.gap < 0).reduce((s, g) => s + g.gap, 0)).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// MAIN DASHBOARD
// ====================================================================

export default function ManufacturingDashboard() {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [machineFilter, setMachineFilter] = useState<"all" | "injection" | "extruder">("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "table" | "analytics">("overview");

  const filteredMachines = useMemo(() => {
    return ALL_MACHINES.filter((machine) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = machine.machineName.toLowerCase().includes(q) || machine.productName.toLowerCase().includes(q);
      const matchesFilter = machineFilter === "all" || machine.machineType.toLowerCase() === machineFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, machineFilter]);

  const stats = useMemo(() => {
    const total = ALL_MACHINES.length;
    const online = ALL_MACHINES.filter((m) => m.status === "online").length;
    const offline = total - online;
    const totalProduction = ALL_MACHINES.reduce((s, m) => s + m.currentOutput, 0);
    const totalTarget = ALL_MACHINES.reduce((s, m) => s + m.dailyTarget, 0);
    const efficiency = Math.round((totalProduction / totalTarget) * 100);
    return { total, online, offline, totalProduction, totalTarget, efficiency };
  }, []);

  const hourlyChartData = HOURLY_DATA.map((d) => ({ label: d.hour, value: d.production }));
  const cumulativeChartData = HOURLY_DATA.reduce<{ label: string; value: number }[]>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].value : 0;
    acc.push({ label: d.hour, value: prev + d.production });
    return acc;
  }, []);

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#E2E8F0",
    fontSize: 13,
    padding: "9px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: active ? "rgba(99,102,241,0.25)" : "transparent",
    color: active ? "#818CF8" : "rgba(255,255,255,0.4)",
    transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1A", fontFamily: "'Inter', system-ui, sans-serif", color: "#E2E8F0" }}>
      {/* Top Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.02)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Factory size={18} strokeWidth={2} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: "#F1F5F9", margin: 0, letterSpacing: "-0.02em" }}>Manufacturing Dashboard</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Production Monitoring System</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981", display: "inline-block" }} />
            LIVE — Mock Data
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>

      {/* Notice Banner */}
      <div style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.2)", padding: "8px 32px", display: "flex", alignItems: "center", gap: 8 }}>
        <AlertCircle size={13} color="#818CF8" />
        <span style={{ fontSize: 11, color: "#818CF8" }}>
          ⚠️ Disclaimer This dashboard currently displays mock data for demonstration and development purposes only. The information shown is not connected to real production machines, databases, or
          live device logs. Future updates will include integration with real-time machine data, production counters, database queries, historical records, device monitoring, and reporting systems.
          Additional features and functionality are currently under development and will be available in upcoming releases.
        </span>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          <StatCard label="Total Machines" value={stats.total} icon={Factory} accent="#6366F1" />
          <StatCard label="Online" value={stats.online} icon={Zap} accent="#10B981" sub="Active now" />
          <StatCard label="Offline" value={stats.offline} icon={AlertCircle} accent="#EF4444" sub="Requires attention" />
          <StatCard label="Total Output" value={stats.totalProduction.toLocaleString()} icon={TrendingUp} accent="#8B5CF6" />
          <StatCard label="Daily Target" value={stats.totalTarget.toLocaleString()} icon={Package} accent="#F59E0B" />
          <StatCard label="Efficiency" value={`${stats.efficiency}%`} icon={CheckCircle2} accent={stats.efficiency >= 80 ? "#10B981" : "#F59E0B"} />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(255,255,255,0.03)",
            padding: 4,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            width: "fit-content",
          }}
        >
          {(["overview", "table", "analytics"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={TAB_STYLE(activeTab === tab)}>
              {tab === "overview" && <Activity size={13} style={{ display: "inline", marginRight: 6 }} />}
              {tab === "table" && <BarChart3 size={13} style={{ display: "inline", marginRight: 6 }} />}
              {tab === "analytics" && <TrendingUp size={13} style={{ display: "inline", marginRight: 6 }} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input type="text" placeholder="Search by machine or product..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <select value={machineFilter} onChange={(e) => setMachineFilter(e.target.value as any)} style={{ ...inputStyle, width: "auto", paddingRight: 32 }}>
              <option value="all">All Machines</option>
              <option value="injection">Injection</option>
              <option value="extruder">Extruder</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
            {/* Machine Sidebar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>Machines</h2>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{filteredMachines.length} found</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
                {filteredMachines.map((machine) => (
                  <MachineCard key={machine.machineId} machine={machine} isSelected={selectedMachine?.machineId === machine.machineId} onClick={() => setSelectedMachine(machine)} />
                ))}
              </div>
            </div>
            {/* Detail Panel */}
            <div>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>Machine Detail</h2>
              </div>
              <MachineOverview machine={selectedMachine} />
            </div>
          </div>
        )}

        {/* TABLE TAB */}
        {activeTab === "table" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Production Details — {filteredMachines.length} machines
              </h2>
            </div>
            <ProductionTable machines={filteredMachines} />
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <BarChart data={hourlyChartData} color="linear-gradient(180deg, #8B5CF6, #6366F1)" label="Hourly Production Output" />
              <BarChart data={cumulativeChartData} color="linear-gradient(180deg, #10B981, #059669)" label="Cumulative Production" />
            </div>
            <GapAnalysis machines={ALL_MACHINES} />
          </div>
        )}
      </div>
    </div>
  );
}
