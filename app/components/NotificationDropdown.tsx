"use client";

import React, { useState } from "react";
import { Bell, AlertTriangle, Info, X } from "lucide-react";

interface AlertItem {
  id: string;
  type: "warning" | "info";
  message: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<AlertItem[]>([]);

  // නිවැරදි කළ නම: NEXT_PUBLIC_API_BASE_URL

  // useEffect(() => {
  //   const fetchAlerts = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       const response = await axios.get(`${API_BASE_URL}/api/esp32/alerts`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       if (response.data.success) {
  //         // දත්ත ලබාගැනීම
  //         setNotifications(response.data.data.reverse());
  //       }
  //     } catch (error) {
  //       console.error("Error fetching alerts:", error);
  //     }
  //   };

  //   fetchAlerts();

  //   const interval = setInterval(fetchAlerts, 60000);
  //   return () => clearInterval(interval);
  // }, [API_BASE_URL]);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-slate-100 transition">
        <Bell size={24} className="text-slate-600" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 max-h-75 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No new notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`flex gap-3 p-3 rounded-xl border ${n.type === "warning" ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
                  {n.type === "warning" ? <AlertTriangle size={20} className="text-red-500 shrink-0" /> : <Info size={20} className="text-blue-500 shrink-0" />}
                  <p className="text-sm text-slate-700 leading-tight">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
