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
    gemini: ServiceResult;
    pubmed: ServiceResult;
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

// shortcut: validates env var format only, not live token generation; prevents billing from public pings
function checkGemini(): ServiceResult {
  const start = now();
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const ok = Boolean(apiKey);
  return {
    ok,
    latencyMs: Math.round(now() - start),
    message: ok
      ? `Gemini API key present (model: ${process.env.GEMINI_MODEL || "gemini-3.7-flash"})`
      : "Missing GEMINI_API_KEY (or GOOGLE_API_KEY)",
    keyHint: redactKey(apiKey),
  };
}

async function checkPubMed(): Promise<ServiceResult> {
  const start = now();
  const ncbiKey = process.env.NCBI_API_KEY;

  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "json");
  url.searchParams.set("retmax", "1");
  url.searchParams.set("term", "hypertrophy");
  url.searchParams.set("tool", "hypertrophy-lab");
  url.searchParams.set("email", "hypertrophylab@example.com");
  if (ncbiKey) url.searchParams.set("api_key", ncbiKey);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        latencyMs: Math.round(now() - start),
        message: `NCBI E-utilities returned HTTP ${res.status}: ${res.statusText}`,
        keyHint: redactKey(ncbiKey),
      };
    }

    const data = await res.json() as { esearchresult?: { idlist?: string[] } };
    const idList = data?.esearchresult?.idlist ?? [];
    return {
      ok: true,
      latencyMs: Math.round(now() - start),
      message: `PubMed E-utilities reachable — esearch returned ${idList.length} PMID(s)`,
      keyHint: redactKey(ncbiKey),
    };
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "AbortError" || err.message.includes("abort"));
    return {
      ok: false,
      latencyMs: Math.round(now() - start),
      message: isTimeout
        ? "PubMed E-utilities check timed out after 8 s"
        : err instanceof Error
        ? err.message
        : "PubMed connectivity check failed",
      keyHint: redactKey(ncbiKey),
    };
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const [supabase, pubmed] = await Promise.all([checkSupabase(), checkPubMed()]);
  const clerk = checkClerk();
  const gemini = checkGemini();

  const services = { clerk, supabase, gemini, pubmed };
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
