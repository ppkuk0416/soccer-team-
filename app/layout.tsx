import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./components/BottomNav";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "축구팀 매처",
  description: "조기축구 팀 자동 구성 & 선수 실력 평가 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <main className="max-w-md mx-auto px-4 pt-6 pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
