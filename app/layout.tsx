import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./components/BottomNav";
import { AppHeader } from "./components/AppHeader";
import { StoreInitializer } from "./components/StoreInitializer";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "팀매처",
  description: "조기축구 팀 관리 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-100">
        <StoreInitializer />
        <AppHeader />
        <main className="max-w-md mx-auto px-4 pt-4 pb-32">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
