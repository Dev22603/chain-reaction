import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Audiowide, JetBrains_Mono } from "next/font/google";

const display = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Chain Reaction // Reactor Console",
  description: "Real-time multiplayer chain reaction in an atomic reactor"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
