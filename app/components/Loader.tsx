"use client";

import Image from "next/image";
import React from "react";

export default function Loader() {
  // --- ඔබට පහසුවෙන් වෙනස් කළ හැකි අගයන් (Configurable Values) ---
  const numDots = 22; // තිත් ගණන
  const tailSpeed = "2.8s"; // වටේ යන තිත් වලිගයේ වේගය (තත්පර අඩු කළහොත් වේගය වැඩි වේ)
  const ringSpeed = "3s"; // ඇතුළත Reverse කැරකෙන රවුමේ වේගය
  const logoSpeed = "4s"; // ලෝගෝ එක කැරකෙන වේගය

  return (
    // Fixed position එක සහ blur effect එක එක් කර ඇත
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm overflow-hidden">
      {/* Full screen පෙනුමට ගැලපෙන පරිදි Loader එකේ ප්‍රමාණය (w-64 h-64) මඳක් විශාල කර ඇත */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* 1. වටේට කැරකෙන තිත් වලිගය (Spinning Comet Tail) */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: tailSpeed, animationTimingFunction: "linear" }}>
          {[...Array(numDots)].map((_, i) => {
            const rotation = (360 / numDots) * i;

            // කුඩාම එකේ සිට ලොකුම එක දක්වා ප්‍රමාණය වැඩි කිරීම
            const dotSize = 2 + i * 0.5;

            const opacity = 0.1 + (i / numDots) * 0.9;

            return (
              <div
                key={i}
                // Light mode එකට ගැලපෙන ලෙස තද නිල් පැහැයක් (bg-blue-900) ලබා දී ඇත
                className="absolute top-1/2 left-1/2 rounded-full bg-blue-900 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  opacity: opacity,
                  // translateY(-110px) මගින් රවුමේ විශාලත්වය තීරණය වේ
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(-110px)`,
                }}
              />
            );
          })}
        </div>

        {/* 2. Reverse කැරකෙන රවුම (ප්‍රමාණය කුඩා කර ඇත - inset-12 මගින් රවුම ඇතුළට ගෙන ඇත) */}
        <div className="absolute inset-12 rounded-full border-2 border-blue-200 border-l-blue-600" style={{ animation: `spin ${ringSpeed} linear infinite reverse` }} />

        {/* 3. මැද Logo එක (කැරකෙන පරිදි වෙනස් කර ඇත) */}
        <div className="relative z-10 w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
          <Image
            src="/logo.png" // ඔබගේ ලෝගෝ එකේ path එක ලබා දෙන්න
            alt="GP Logo"
            width={80}
            height={80}
            className="object-contain"
            // මෙතන තිබුණු pulse animation එක ඉවත් කර spin animation එක ලබා දී ඇත
            style={{ animation: `spin ${logoSpeed} linear infinite`, width: "auto", height: "auto" }}
          />
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-12 flex flex-col items-center">
        {/* Light theme එක නිසා අකුරු තද නිල් පැහැ කර ඇත */}
        <h2 className="text-blue-700 font-bold tracking-[0.3em] text-sm uppercase drop-shadow-sm">Loading</h2>

        {/* Loading Progress Line */}
        <div className="mt-3 w-32 h-0.5 bg-blue-200 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-transparent via-blue-600 to-transparent w-full" style={{ animation: "translate-x 1.5s ease-in-out infinite" }} />
        </div>
      </div>

      {/* Progress Line එක සඳහා Animation එක */}
      <style>{`
        @keyframes translate-x {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
