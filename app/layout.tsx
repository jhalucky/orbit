import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Work_Sans } from "next/font/google";
import { AppProvider } from "@/lib/app-context";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Orbit",
    template: "%s · Orbit",
  },
  description:
    "Find a local business, tell them what you need, and get it sorted.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper font-sans text-ink">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
