import Image from "next/image";

export function CometTailFullScreenLoader() {
  const numDots = 22;
  const tailSpeed = "2s";
  const ringSpeed = "3s";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-50 backdrop-blur-sm overflow-hidden">
      {/* Loader Container */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* 1. Spinning Comet Tail */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: tailSpeed, animationTimingFunction: "linear" }}>
          {[...Array(numDots)].map((_, i) => {
            const rotation = (360 / numDots) * i;
            const dotSize = 2 + i * 0.5;
            const opacity = 0.1 + (i / numDots) * 0.9;

            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  opacity: opacity,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(-110px)`,
                }}
              />
            );
          })}
        </div>

        {/* 2. Reverse Rotating Ring */}
        <div className="absolute inset-12 rounded-full border-2 border-blue-300 border-l-blue-500" style={{ animation: `spin ${ringSpeed} linear infinite reverse` }} />

        {/* 3. Center Logo */}
        <div className="relative z-10 w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-blue-100">
          <Image src="/logo.png" alt="Flexicare Logo" style={{ width: "auto", height: "auto" }} width={80} height={80} className="object-contain" />
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-12 flex flex-col items-center">
        <h2 className="text-white font-bold tracking-widest text-sm uppercase drop-shadow-lg">Verifying...</h2>

        {/* Loading Progress Line */}
        <div className="mt-4 w-40 h-1 bg-blue-300 bg-opacity-30 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-transparent via-blue-400 to-transparent w-full" style={{ animation: "translate-x 1.5s ease-in-out infinite" }} />
        </div>

        {/* Additional Info */}
        <p className="text-white text-opacity-70 text-xs mt-3">Authenticating your account...</p>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes translate-x {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
