import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./components/BottomNav";
import { AppHeader } from "./components/AppHeader";
import { StoreInitializer } from "./components/StoreInitializer";
import { Toaster } from "./components/Toaster";
import { LoadingScreen } from "./components/LoadingScreen";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "팀매처",
  description: "조기축구 팀 관리 플랫폼",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "팀매처",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full" style={{ background: 'var(--background)' }}>
        <StoreInitializer />
        <LoadingScreen />
        <Toaster />
        <AppHeader />
        <main className="max-w-md mx-auto px-4 pt-5 pb-32">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
