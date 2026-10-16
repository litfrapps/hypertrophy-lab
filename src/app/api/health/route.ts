import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ServiceResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  keyHint?: string;
}

interface HealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    clerk: ServiceResult;
    supabase: ServiceResult;
  };
}

function redactKey(key: string | undefined): string | undefined {
  if (!key || key.length < 10) return key ? "***" : undefined;
  return `${key.slice(0, 6)}…${key.slice(-3)}`;
}

const now = () => performance.now();

// ─── Per-service checks ────────────────────────────────────────────────────────

// shortcut: validates env vars only, not live Clerk API; avoids burning paid user-list calls on public pings
function checkClerk(): ServiceResult {
  const start = now();
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const ok = Boolean(secretKey && publishableKey);
  return {
    ok,
    latencyMs: Math.round(now() - start),
    message: ok
      ? "Clerk env vars present"
      : "Missing CLERK_SECRET_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    keyHint: redactKey(secretKey),
  };
}

async function checkSupabase(): Promise<ServiceResult> {
  const start = now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      ok: false,
      latencyMs: Math.round(now() - start),
      message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      keyHint: redactKey(anonKey),
    };
  }

  try {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.from("workout_logs").select("id").limit(1);

    const isRlsOrAuth = Boolean(
      error?.code === "42501" ||
      error?.code === "PGRST301" ||
      error?.message?.toLowerCase().includes("row-level security") ||
      error?.message?.toLowerCase().includes("permission denied")
    );

    return {
      ok: !error || isRlsOrAuth,
      latencyMs: Math.round(now() - start),
      message: !error
        ? "Supabase reachable — workout_logs accessible"
        : isRlsOrAuth
        ? `Supabase reachable — RLS active (expected): ${error.message}`
        : `Supabase query error: ${error.message}`,
      keyHint: redactKey(anonKey),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.round(now() - start),
      message: err instanceof Error ? err.message : "Supabase connectivity check failed",
      keyHint: redactKey(anonKey),
    };
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await checkSupabase();
  const clerk = checkClerk();

  const services = { clerk, supabase };
  const results = Object.values(services);
  const okCount = results.filter((s) => s.ok).length;

  const status: HealthReport["status"] =
    okCount === results.length ? "healthy" : okCount === 0 ? "unhealthy" : "degraded";

  const report: HealthReport = {
    status,
    timestamp: new Date().toISOString(),
    services,
  };

  return NextResponse.json(report, { status: 200 });
}
