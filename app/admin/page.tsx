"use client";

import { Factory, Users, Activity, Cpu, TrendingUp, AlertTriangle } from "lucide-react";

export default function AdminPage() {
  const stats = [
    {
      title: "Total Factories",
      value: "1",
      icon: Factory,
      color: "bg-blue-500",
    },
    {
      title: "Total Users",
      value: "25",
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Machines Online",
      value: "48",
      icon: Cpu,
      color: "bg-purple-500",
    },
    {
      title: "Production Today",
      value: "125,430",
      icon: Activity,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>

        <p className="text-slate-500 mt-1">Factory Production Monitoring System Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{item.title}</p>

                  <h2 className="text-3xl font-bold mt-2 text-slate-800">{item.value}</h2>
                </div>

                <div className={`${item.color} w-14 h-14 rounded-xl flex items-center justify-center text-white`}>
                  <Icon size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-4">System Status</h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Backend API</span>

              <span className="text-green-600 font-semibold">Online</span>
            </div>

            <div className="flex justify-between">
              <span>Database</span>

              <span className="text-green-600 font-semibold">Connected</span>
            </div>

            <div className="flex justify-between">
              <span>MQTT Broker</span>

              <span className="text-green-600 font-semibold">Running</span>
            </div>

            <div className="flex justify-between">
              <span>WebSocket</span>

              <span className="text-green-600 font-semibold">Active</span>
            </div>
          </div>
        </div>

        {/* Production Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-4">Production Summary</h2>

          <div className="space-y-4">
            <div>
              <p className="text-slate-500 text-sm">Production Efficiency</p>

              <p className="text-3xl font-bold text-green-600">87%</p>
            </div>

            <div>
              <p className="text-slate-500 text-sm">OEE Performance</p>

              <p className="text-3xl font-bold text-blue-600">82%</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-orange-500" />

            <h2 className="text-lg font-bold">Alerts</h2>
          </div>

          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">Machine M-03 stopped unexpectedly.</div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3">Line 02 production below target.</div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-3">Daily backup completed successfully.</div>
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="text-green-600" />

          <h2 className="text-lg font-bold">Performance Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Best Performing Line</p>

            <p className="text-2xl font-bold mt-2">Line 01</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Active Machines</p>

            <p className="text-2xl font-bold mt-2">48 / 50</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Shift Target Achievement</p>

            <p className="text-2xl font-bold mt-2">92%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
