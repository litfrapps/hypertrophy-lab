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
  metadataBase: new URL("https://hypertrophy-lab-ten.vercel.app"),
  title: "Muscle Lab — Clean, Powerful & Easy-to-Use Weight Training Logger",
  description:
    "Muscle Lab is a clean, powerful, and easy-to-use weight training logger and workout tracker. Effortlessly log sets and reps, track progressive overload, monitor strength analytics, and manage routines for lifters of all experience levels.",
  keywords: [
    "muscle lab",
    "weight training logger",
    "workout tracker",
    "strength training log",
    "progressive overload planner",
    "gym workout log",
    "rep and set tracker",
    "lifting log",
    "exercise tracker",
  ],
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": [{ url: "/llms.txt", title: "LLM & Agent Documentation" }],
    },
  },
  openGraph: {
    title: "Muscle Lab — Clean, Powerful & Easy-to-Use Weight Training Logger",
    description:
      "Muscle Lab is a clean, powerful, and easy-to-use weight training logger and workout tracker. Effortlessly log sets and reps, track progressive overload, and manage routines for lifters of all experience levels.",
    url: "https://hypertrophy-lab-ten.vercel.app",
    siteName: "Muscle Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muscle Lab — Clean, Powerful & Easy-to-Use Weight Training Logger",
    description:
      "Clean, powerful, and easy-to-use weight training logger and progressive overload tracker for lifters of all experience levels.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Muscle Lab",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#08080A",
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