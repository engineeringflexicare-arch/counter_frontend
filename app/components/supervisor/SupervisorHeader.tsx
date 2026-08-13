"use client";

import { SupervisorUser } from "@/types/Supervisor";

interface SupervisorHeaderProps {
  user: SupervisorUser | null;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export default function SupervisorHeader({ user, title, subtitle, actionButton }: SupervisorHeaderProps) {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {subtitle && <p className="text-blue-100 mb-4">{subtitle}</p>}
          <p className="text-blue-100">
            {getTimeOfDay()}, {user?.name || "Supervisor"}! 👋
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold mb-2">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {actionButton && <div>{actionButton}</div>}
        </div>
      </div>
    </div>
  );
}
