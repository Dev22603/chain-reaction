import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Big_Shoulders, Fraunces, JetBrains_Mono } from "next/font/google";

const display = Big_Shoulders({
  weight: ["400", "600", "800", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false
});

const editorial = Fraunces({
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Chain Reaction // Atomic Edition",
  description: "Friction-free realtime chain reaction. Play as a guest, sign in for XP."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${editorial.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
