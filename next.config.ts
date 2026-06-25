import type { NextConfig } from "next";

import withPWAInit from "next-pwa";

// 1. Core Next.js Configuration
const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.154"],
};

// 2. Safely Detect Development/Turbopack flags
const isDevelopment = 
  process.env.NODE_ENV === "development" || 
  process.argv.includes("--turbo");

// 3. Conditionally construct configuration payload
const finalConfig = !isDevelopment
  ? withPWAInit({ dest: "public" })(nextConfig)
  : nextConfig;

// 4. Uniform single top-level module export
export default finalConfig;
