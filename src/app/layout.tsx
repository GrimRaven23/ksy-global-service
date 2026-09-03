import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KSY Global Service — Gestion de Documents",
  description: "Facturation & Livraison Professionnelle — KSY GLOBAL SERVICE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f0f2f5] text-[#1a1a2e]">
        {children}
      </body>
    </html>
  );
}
