import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata, Viewport } from "next";
import { Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientProviders } from "@/components/layout/client-providers";
import { WorkoutProvider } from "@/context/workout-context";

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
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

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${orbitron.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#08080a] text-white font-sans antialiased selection:bg-[#ff1e27] selection:text-white">
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
                <main className="lg:ml-60 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen">
                  <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-7 py-3.5 sm:py-4.5 lg:py-6">
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