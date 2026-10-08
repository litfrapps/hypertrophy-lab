import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientProviders } from "@/components/layout/client-providers";
import { WorkoutProvider } from "@/context/workout-context";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Muscle Lab — Science-Backed Hypertrophy Tracker",
  description:
    "Track your hypertrophy training with scientific precision. Log workouts, visualize progressive overload, and learn from peer-reviewed research.",
  keywords: [
    "muscle lab",
    "hypertrophy",
    "workout tracker",
    "muscle growth",
    "strength training",
    "progressive overload",
    "fitness",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Muscle Lab",
  },
};

export const viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <TooltipProvider>
            <ClientProviders>
              {/*
               * WorkoutProvider wraps the whole app so that the active session
               * state (exercises, live volume, set mutators) is available to
               * both the /log page AND the Navbar floating banner without
               * prop-drilling through the layout tree.
               */}
              <WorkoutProvider>
                <Navbar />
                {/* Main content area — offset for desktop sidebar and mobile top bar */}
                <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    {children}
                  </div>
                </main>
              </WorkoutProvider>
            </ClientProviders>
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}