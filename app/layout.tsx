import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Core Metadata Linking to Manifest Routing Path
export const metadata: Metadata = {
  title: "Flexi Dashboard",
  description: "Production Monitoring System",
  manifest: "/manifest", // Points automatically to app/manifest.ts
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flexi Dashboard",
  },
};

// 2. Separate Viewport Configuration (Required in modern Next.js versions)
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
