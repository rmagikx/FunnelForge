import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "FunnelForge — AI-Powered Marketing Content Engine",
  description:
    "Turn your brand voice into a full-funnel content engine. Upload documents, analyze your brand persona, and generate conversion-ready content across 7 channels.",
  keywords: [
    "AI content generator",
    "marketing funnel",
    "brand voice",
    "content engine",
    "full-funnel marketing",
  ],
  openGraph: {
    title: "FunnelForge — AI-Powered Marketing Content Engine",
    description:
      "Turn your brand voice into a full-funnel content engine across 7 channels.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
