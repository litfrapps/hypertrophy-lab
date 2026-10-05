"use client";
import { UnitProvider } from "@/contexts/unit-context";
import { SessionProvider } from "@/contexts/session-context";
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <UnitProvider>
      <SessionProvider>{children}</SessionProvider>
    </UnitProvider>
  );
}
