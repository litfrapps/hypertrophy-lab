"use client";
import { SessionProvider } from "@/contexts/session-context";
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
