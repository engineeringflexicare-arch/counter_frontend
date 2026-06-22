// "use client";

// import React from "react";
// import Image from "next/image"; // Image component එක import කිරීම

// // Loader types සඳහා වෙනම Type එකක් සෑදීම (any ඉවත් කිරීමට)
// type LoaderStyleType = "default" | "minimal" | "tech" | "premium" | "sleek" | "dark" | "animated";

// // ==================== VARIATION 1: MINIMAL BLUE LOADER ====================
// export function MinimalGPLoader() {
//   return (
//     <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
//       <style>{`
//         @keyframes minimalSpin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//         @keyframes blueGlow {
//           0%,100% { text-shadow: 0 0 10px rgba(3,102,214,.7); }
//           50% { text-shadow: 0 0 25px rgba(59,130,246,1); }
//         }
//       `}</style>

//       <div className="relative text-center">
//         <Image
//           src="/logo.png"
//           alt="GP Logo"
//           width={96}
//           height={96}
//           className="w-24 h-24 mx-auto mb-6"
//           style={{
//             animation: "minimalSpin 3s linear infinite",
//             filter: "drop-shadow(0 0 20px rgba(3,102,214,.8))",
//             width: "auto",
//             height: "auto",
//           }}
//         />
//         <h2 className="text-2xl font-bold text-blue-400" style={{ animation: "blueGlow 2s infinite" }}>
//           LOADING
//         </h2>
//         <div className="flex gap-1 mt-4 justify-center">
//           {[0, 1, 2].map((i) => (
//             <div
//               key={i}
//               className="w-3 h-3 rounded-full bg-blue-400"
//               style={{
//                 animation: `pulse 1.5s ease-in-out infinite`,
//                 animationDelay: `${i * 0.3}s`,
//                 boxShadow: "0 0 8px rgba(3,102,214,.8)",
//               }}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==================== VARIATION 2: TECH PROFESSIONAL ====================
// export function TechProfessionalGPLoader() {
//   return (
//     <div className="min-h-screen bg-linear-to-b from-blue-950 via-slate-900 to-black flex items-center justify-center overflow-hidden">
//       <style>{`
//         @keyframes techPulse {
//           0% { transform: scale(1); opacity: 1; }
//           100% { transform: scale(2.5); opacity: 0; }
//         }
//         @keyframes techGlow {
//           0%,100% { box-shadow: 0 0 15px rgba(3,102,214,.5); }
//           50% { box-shadow: 0 0 40px rgba(3,102,214,1); }
//         }
//       `}</style>

//       <div className="relative text-center z-10">
//         {/* Pulse rings */}
//         <div className="absolute w-40 h-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
//           {[0, 1, 2].map((i) => (
//             <div
//               key={i}
//               className="absolute inset-0 border-2 border-blue-500/50 rounded-full"
//               style={{
//                 animation: `techPulse 2.5s ease-out infinite`,
//                 animationDelay: `${i * 0.7}s`,
//               }}
//             />
//           ))}
//         </div>

//         {/* Logo */}
//         <div className="w-32 h-32 rounded-xl border-2 border-blue-500 flex items-center justify-center bg-black/60 relative" style={{ animation: "techGlow 2.5s infinite" }}>
//           <Image src="/logo.png" alt="GP Logo" style={{ width: "auto", height: "auto" }} width={80} height={80} className="w-20 h-20" />
//         </div>

//         <h3 className="text-blue-400 text-sm tracking-widest mt-8 font-mono">INITIALIZING</h3>
//         <div className="flex gap-1 mt-4">
//           {[...Array(4)].map((_, i) => (
//             <div
//               key={i}
//               className="w-1 h-10 bg-linear-to-t from-blue-500 to-blue-300"
//               style={{
//                 animation: `pulse 1.5s ease-in-out infinite`,
//                 animationDelay: `${i * 0.2}s`,
//               }}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==================== VARIATION 3: PREMIUM GLOW ====================
// export function PremiumGlowGPLoader() {
//   return (
//     <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
//       <style>{`
//         @keyframes premiumGlow {
//           0%,100% {
//             filter: drop-shadow(0 0 15px rgba(3,102,214,.6))
//                     drop-shadow(0 0 30px rgba(3,102,214,.3));
//             transform: scale(1);
//           }
//           50% {
//             filter: drop-shadow(0 0 30px rgba(3,102,214,.95))
//                     drop-shadow(0 0 60px rgba(59,130,246,.8))
//                     drop-shadow(0 0 90px rgba(3,102,214,.5));
//             transform: scale(1.1);
//           }
//         }
//       `}</style>

//       {/* Animated background circles */}
//       <div className="absolute inset-0 opacity-20">
//         {[...Array(4)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute rounded-full border border-blue-500"
//             style={{
//               width: `${(i + 1) * 80}px`,
//               height: `${(i + 1) * 80}px`,
//               top: "50%",
//               left: "50%",
//               transform: "translate(-50%, -50%)",
//               animation: `spin ${15 + i * 5}s linear infinite`,
//               animationDirection: i % 2 === 0 ? "normal" : "reverse",
//             }}
//           />
//         ))}
//       </div>

//       <div className="relative text-center z-10">
//         <div className="relative w-40 h-40 mx-auto mb-8">
//           <Image
//             src="/logo.png"
//             alt="GP Logo"
//             width={160}
//             height={160}
//             className="w-full h-full"
//             style={{
//               animation: "premiumGlow 3.5s ease-in-out infinite",
//               width: "auto",
//               height: "auto",
//             }}
//           />
//         </div>

//         <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-blue-600 mb-2">GP SYSTEMS</h2>
//         <p className="text-blue-300/70 text-sm tracking-widest mb-8">PROCESSING</p>

//         <div className="flex justify-center gap-2">
//           {[...Array(6)].map((_, i) => (
//             <div
//               key={i}
//               className="w-2 h-12 rounded-full bg-linear-to-b from-blue-400 to-blue-600"
//               style={{
//                 animation: `pulse 1.2s ease-in-out infinite`,
//                 animationDelay: `${i * 0.1}s`,
//                 boxShadow: "0 0 10px rgba(3,102,214,.8)",
//               }}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==================== VARIATION 4: SLEEK MODERN ====================
// export function SleekModernGPLoader() {
//   return (
//     <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
//       <style>{`
//         @keyframes sleekSpin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//         @keyframes sleekScale {
//           0%,100% { transform: scale(1); }
//           50% { transform: scale(1.1); }
//         }
//       `}</style>

//       <div className="relative text-center">
//         {/* Outer ring */}
//         <div className="w-40 h-40 mx-auto rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500" style={{ animation: "sleekSpin 2s linear infinite" }} />

//         {/* Logo container */}
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
//           <Image
//             src="/logo.png"
//             alt="GP Logo"
//             width={96}
//             height={96}
//             className="w-24 h-24"
//             style={{
//               filter: "drop-shadow(0 0 15px rgba(3,102,214,.8))",
//               animation: "sleekScale 2s ease-in-out infinite",
//               width: "auto",
//               height: "auto",
//             }}
//           />
//         </div>

//         {/* Text */}
//         <h2 className="text-2xl font-bold text-blue-400 mt-32 tracking-wider">GP</h2>
//         <p className="text-blue-300/60 text-xs tracking-widest mt-2">PROFESSIONAL SYSTEMS</p>

//         {/* Indicator */}
//         <div className="mt-6 w-32 h-1 bg-blue-900 rounded-full mx-auto overflow-hidden">
//           <div
//             className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full"
//             style={{
//               animation: `slideProgress 2s ease-in-out infinite`,
//             }}
//           />
//         </div>

//         <style>{`
//           @keyframes slideProgress {
//             0% { width: 0%; }
//             50% { width: 100%; }
//             100% { width: 0%; }
//           }
//         `}</style>
//       </div>
//     </div>
//   );
// }

// // ==================== VARIATION 5: DARK BLUE PREMIUM ====================
// export function DarkBluePremiumGPLoader() {
//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-black flex items-center justify-center overflow-hidden">
//       <style>{`
//         @keyframes darkGlow {
//           0%,100% {
//             filter: drop-shadow(0 0 10px rgba(3,102,214,.5));
//             box-shadow: inset 0 0 20px rgba(3,102,214,.1);
//           }
//           50% {
//             filter: drop-shadow(0 0 30px rgba(3,102,214,.9))
//                     drop-shadow(0 0 50px rgba(59,130,246,.6));
//             box-shadow: inset 0 0 30px rgba(3,102,214,.3);
//           }
//         }
//       `}</style>

//       <div className="relative text-center">
//         {/* Main container with glow */}
//         <div className="w-44 h-44 rounded-2xl border-2 border-blue-500/40 flex items-center justify-center bg-black/80" style={{ animation: "darkGlow 2.5s ease-in-out infinite" }}>
//           <Image
//             src="/logo.png"
//             alt="GP Logo"
//             width={96}
//             height={96}
//             className="w-24 h-24"
//             style={{
//               filter: "drop-shadow(0 0 15px rgba(3,102,214,.8))",
//             }}
//           />
//         </div>

//         {/* Text below */}
//         <h2 className="text-2xl font-bold text-blue-400 mt-8">GP</h2>
//         <p className="text-blue-300/50 text-xs tracking-widest mt-2">LOADING</p>

//         {/* Dots below */}
//         <div className="mt-6 flex justify-center gap-2">
//           {[...Array(3)].map((_, i) => (
//             <div
//               key={i}
//               className="w-2 h-2 rounded-full bg-blue-500"
//               style={{
//                 animation: `bounce 1.4s ease-in-out infinite`,
//                 animationDelay: `${i * 0.2}s`,
//               }}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==================== BONUS: ANIMATED BACKGROUND ====================
// export function AnimatedBGGPLoader() {
//   return (
//     <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-black">
//       <style>{`
//         @keyframes floatBg {
//           0%,100% { transform: translateY(0px) translateX(0px); }
//           25% { transform: translateY(-20px) translateX(10px); }
//           50% { transform: translateY(-10px) translateX(-10px); }
//           75% { transform: translateY(10px) translateX(20px); }
//         }

//         @keyframes logoFloat {
//           0%,100% { transform: translateY(0px); }
//           50% { transform: translateY(-15px); }
//         }
//       `}</style>

//       {/* Animated background shapes */}
//       <div className="absolute inset-0 opacity-20">
//         <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" style={{ animation: "floatBg 8s ease-in-out infinite", top: "10%", left: "10%" }} />
//         <div className="absolute w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" style={{ animation: "floatBg 10s ease-in-out infinite 2s", bottom: "10%", right: "10%" }} />
//       </div>

//       {/* Content */}
//       <div className="relative text-center z-10">
//         <Image
//           src="/logo.png"
//           alt="GP Logo"
//           width={112}
//           height={112}
//           className="w-28 h-28 mx-auto mb-8"
//           style={{
//             animation: "logoFloat 3s ease-in-out infinite",
//             filter: "drop-shadow(0 0 20px rgba(3,102,214,.8))",
//           }}
//         />

//         <h2 className="text-3xl font-bold text-blue-400 mb-2">GP SYSTEMS</h2>
//         <p className="text-blue-300/60 text-sm tracking-widest">Advanced Solutions</p>

//         {/* Progress bar */}
//         <div className="mt-8 w-48 h-1 bg-blue-950 rounded-full mx-auto overflow-hidden">
//           <div
//             className="h-full bg-linear-to-r from-blue-400 via-blue-500 to-blue-600"
//             style={{
//               animation: "slideProgress 2.5s ease-in-out infinite",
//             }}
//           />
//         </div>

//         <p className="text-white/50 text-xs mt-4">Loading...</p>
//       </div>
//     </div>
//   );
// }

// // ==================== DEFAULT LOADER ====================
// export function GPLoaderDefault() {
//   return (
//     <div className="min-h-screen relative bg-linear-to-br from-slate-900 via-blue-950 to-black flex items-center justify-center overflow-hidden">
//       <style>{`
//         @keyframes float {
//           0%,100% { transform: translateY(0px); }
//           50% { transform: translateY(-20px); }
//         }

//         @keyframes glow {
//           0%,100% {
//             box-shadow:
//               0 0 20px rgba(3,102,214,.6),
//               0 0 40px rgba(3,102,214,.3),
//               inset 0 0 20px rgba(3,102,214,.2);
//           }
//           50% {
//             box-shadow:
//               0 0 40px rgba(3,102,214,.9),
//               0 0 80px rgba(59,130,246,.6),
//               inset 0 0 30px rgba(3,102,214,.4);
//           }
//         }

//         @keyframes logoGlow {
//           0%,100% {
//             filter: drop-shadow(0 0 10px rgba(3,102,214,.6))
//                     drop-shadow(0 0 20px rgba(3,102,214,.3));
//             transform: scale(1);
//           }
//           50% {
//             filter: drop-shadow(0 0 25px rgba(3,102,214,.9))
//                     drop-shadow(0 0 40px rgba(59,130,246,.7))
//                     drop-shadow(0 0 60px rgba(3,102,214,.5));
//             transform: scale(1.08);
//           }
//         }

//         @keyframes pulseGlow {
//           0%,100% { opacity: 0.6; }
//           50% { opacity: 1; }
//         }

//         @keyframes gridBg {
//           0% { background-position: 0 0; }
//           100% { background-position: 100px 100px; }
//         }
//       `}</style>

//       {/* Grid Background */}
//       <div
//         className="absolute inset-0 opacity-10"
//         style={{
//           backgroundImage: `
//             linear-gradient(to right, rgba(3,102,214,.2) 1px, transparent 1px),
//             linear-gradient(to bottom, rgba(3,102,214,.2) 1px, transparent 1px)
//           `,
//           backgroundSize: "50px 50px",
//           animation: "gridBg 20s linear infinite",
//         }}
//       />

//       {/* Background Orbs */}
//       <div className="absolute w-96 h-96 bg-blue-600/20 blur-3xl rounded-full -top-32 -left-32" />
//       <div className="absolute w-96 h-96 bg-blue-500/10 blur-3xl rounded-full -bottom-32 -right-32" />

//       <div className="relative text-center z-10">
//         <div className="w-48 h-48 mx-auto relative animate-float">
//           {/* Outer Ring */}
//           <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-blue-500 border-r-blue-500 animate-spin" />

//           {/* Middle Ring */}
//           <div className="absolute inset-4 rounded-full border-2 border-blue-400" style={{ animation: "glow 2.5s ease-in-out infinite" }} />

//           {/* Inner Shadow */}
//           <div className="absolute inset-8 rounded-full bg-black/40 blur-md" />

//           {/* Logo Container */}
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="absolute inset-0 rounded-full bg-blue-600/15 blur-3xl" />

//             <Image
//               src="/logo.png"
//               alt="GP Logo"
//               width={80}
//               height={80}
//               className="w-20 h-20 relative z-10 object-contain"
//               style={{
//                 animation: "logoGlow 3s ease-in-out infinite",
//               }}
//             />

//             <div className="absolute inset-0 rounded-full border border-blue-500/40" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />

//             <div
//               className="absolute inset-6 rounded-full border border-blue-400/25"
//               style={{
//                 animation: "glow 3s ease-in-out infinite reverse",
//               }}
//             />
//           </div>
//         </div>

//         <h2 className="text-3xl font-bold mt-8 text-blue-400 drop-shadow-lg" style={{ textShadow: "0 0 20px rgba(3,102,214,.8)" }}>
//           GP
//         </h2>

//         <p className="text-blue-300 text-sm tracking-widest mt-2 animate-pulse">SYSTEMS & SOLUTIONS</p>

//         <div className="mt-8 flex justify-center gap-2">
//           {[...Array(5)].map((_, i) => (
//             <div
//               key={i}
//               className="w-2 h-2 rounded-full bg-blue-400"
//               style={{
//                 animation: `pulseGlow 1.5s ease-in-out infinite`,
//                 animationDelay: `${i * 0.2}s`,
//                 boxShadow: "0 0 8px rgba(3,102,214,.8)",
//               }}
//             />
//           ))}
//         </div>

//         <p className="text-white/70 text-xs mt-6 tracking-wider">Loading...</p>
//       </div>
//     </div>
//   );
// }

// // ==================== MAIN SHOWCASE ====================
// export default function GPLoaderShowcase() {
//   // `LoaderStyleType` භාවිතා කර type එක නිවැරදි කිරීම
//   const [loaderType, setLoaderType] = React.useState<LoaderStyleType>("default");

//   const loaders = {
//     default: <GPLoaderDefault />,
//     minimal: <MinimalGPLoader />,
//     tech: <TechProfessionalGPLoader />,
//     premium: <PremiumGlowGPLoader />,
//     sleek: <SleekModernGPLoader />,
//     dark: <DarkBluePremiumGPLoader />,
//     animated: <AnimatedBGGPLoader />,
//   };

//   return (
//     <div>
//       {loaders[loaderType]}

//       {/* Style Selector - Dev Only */}
//       {process.env.NODE_ENV === "development" && (
//         <div className="fixed bottom-4 right-4 flex flex-wrap gap-2 z-50 max-w-xs">
//           {(Object.keys(loaders) as LoaderStyleType[]).map((type) => (
//             <button
//               key={type}
//               onClick={() => setLoaderType(type)} // මෙතන තිබුණු (type as any) ගැටළුව දැන් විසඳී ඇත
//               className={`px-2 py-1 rounded text-xs font-bold uppercase transition-all ${loaderType === type ? "bg-blue-500 text-white" : "bg-blue-950/50 text-blue-400 border border-blue-500/50"}`}
//             >
//               {type}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
