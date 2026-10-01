import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hypertrophy Lab — Science-Backed Workout Tracker",
  description:
    "Track your hypertrophy training with scientific precision. Log workouts, visualize progress, and learn from peer-reviewed research by Brad Schoenfeld and more.",
  keywords: [
    "hypertrophy",
    "workout tracker",
    "muscle growth",
    "strength training",
    "Brad Schoenfeld",
    "fitness",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TooltipProvider>
          <Navbar />
          {/* Main content area — offset for desktop sidebar and mobile top bar */}
          <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {children}
            </div>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
