"use client";

import Image from "next/image";
import React from "react";

export default function GPAdvancedLoader() {
  // තිත් ගණන මෙතැනින් වෙනස් කළ හැක
  const numDots = 16;

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-blue-950 to-black flex flex-col items-center justify-center overflow-hidden">
      <style>{`
        @keyframes spin-clockwise {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-counter {
          100% { transform: rotate(-360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(59,130,246,0.5)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 25px rgba(59,130,246,0.9)); transform: scale(1.05); }
        }
      `}</style>

      {/* Loader Container */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* 1. පිටත තිත් රවුම (Rotating Dot Ring) */}
        <div className="absolute inset-0" style={{ animation: "spin-clockwise 6s linear infinite" }}>
          {[...Array(numDots)].map((_, i) => {
            // එක් එක් තිත තිබිය යුතු කෝණය (Angle)
            const rotation = (360 / numDots) * i;

            // තිතේ ප්‍රමාණය ටිකෙන් ටික විශාල වීම (pixels 3 සිට 10 පමණ දක්වා)
            const dotSize = 3 + i * 0.5;

            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full bg-blue-400"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  // මැද සිට පිටතට ගෙන ගොස් රවුම හැදීම
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(-120px)`,
                  boxShadow: "0 0 10px rgba(59,130,246,0.8)",
                  // මුලින් ඇති තිත් ටිකක් අඳුරු වීම සඳහා
                  opacity: 0.3 + (i / numDots) * 0.7,
                }}
              />
            );
          })}
        </div>

        {/* 2. දකුණට කැරකෙන රවුම (Clockwise Circle) */}
        <div className="absolute inset-10 rounded-full border-y-2 border-transparent border-t-blue-500 border-b-blue-400 opacity-80" style={{ animation: "spin-clockwise 3s linear infinite" }} />

        {/* 3. වමට කැරකෙන රවුම (Counter-Clockwise Circle) */}
        <div className="absolute inset-14 rounded-full border-x-2 border-transparent border-l-blue-300 border-r-blue-600 opacity-60" style={{ animation: "spin-counter 4s linear infinite" }} />

        {/* 4. මැද Logo එක */}
        <div
          className="relative z-10 flex items-center justify-center bg-black/50 rounded-full w-28 h-28 backdrop-blur-md border border-blue-500/20"
          style={{ animation: "pulse-glow 2.5s ease-in-out infinite" }}
        >
          <Image
            src="/logo.png" // ඔබගේ ලෝගෝ එකේ path එක
            alt="GP Logo"
            width={72}
            height={72}
            className="object-contain"
          />
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-12 flex flex-col items-center">
        <h2 className="text-blue-400 font-bold tracking-[0.4em] text-lg uppercase animate-pulse drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">Loading</h2>
        <div className="flex gap-2 mt-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-blue-500 rounded-full"
              style={{
                animation: `bounce 1.5s infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
