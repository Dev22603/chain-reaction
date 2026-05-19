import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bungee, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const display = Bungee({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const body = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Chain Reaction",
  description: "Pop. Bounce. Take over the board. Play free with friends — no signup needed."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
