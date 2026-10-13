import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  /** Redacted key signature — never the raw secret */
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a redacted key hint showing only the first 6 and last 3 characters.
 * e.g. "sk_test_N2WrcdpEp6R3t4sR..." → "sk_tes…3TpL"
 */
function redactKey(key: string | undefined): string | undefined {
  if (!key || key.length < 10) return key ? "***" : undefined;
  return `${key.slice(0, 6)}…${key.slice(-3)}`;
}

/** Returns current high-resolution timestamp in milliseconds. */
const now = () => performance.now();

// ─── Per-service checks ───────────────────────────────────────────────────────

async function checkClerk(): Promise<ServiceResult> {
  const start = now();
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    return {
      ok: false,
      latencyMs: Math.round(now() - start),
      message: "Missing CLERK_SECRET_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      keyHint: redactKey(secretKey),
    };
  }

  try {
    const clerk = createClerkClient({ secretKey });
    // Lightweight probe: fetch the first page of users (limit 1)
    await clerk.users.getUserList({ limit: 1 });
    return {
      ok: true,
      latencyMs: Math.round(now() - start),
      message: "Clerk API reachable — user list fetched successfully",
      keyHint: redactKey(secretKey),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.round(now() - start),
      message: err instanceof Error ? err.message : "Clerk connectivity check failed",
      keyHint: redactKey(secretKey),
    };
  }
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

    if (error) {
      // RLS errors (e.g. 42501 / PGRST301) mean the DB is reachable but
      // anonymous access is restricted — this is expected and healthy.
      const isRlsOrAuth =
        error.code === "42501" ||
        error.code === "PGRST301" ||
        error.message?.toLowerCase().includes("row-level security") ||
        error.message?.toLowerCase().includes("permission denied");

      return {
        ok: isRlsOrAuth,
        latencyMs: Math.round(now() - start),
        message: isRlsOrAuth
          ? `Supabase reachable — RLS active (expected): ${error.message}`
          : `Supabase query error: ${error.message}`,
        keyHint: redactKey(anonKey),
      };
    }

    return {
      ok: true,
      latencyMs: Math.round(now() - start),
      message: "Supabase reachable — workout_logs table accessible",
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

async function checkGemini(): Promise<ServiceResult> {
  const start = now();
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      latencyMs: Math.round(now() - start),
      message: "Missing GEMINI_API_KEY (or GOOGLE_API_KEY)",
      keyHint: undefined,
    };
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.7-flash";
  const fallbackModel = primaryModel === "gemini-3.7-flash" ? "gemini-3.8-flash" : "gemini-3.7-flash";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    let usedModel = primaryModel;
    let result;
    try {
      const model = genAI.getGenerativeModel({ model: primaryModel });
      result = await model.generateContent("ping");
    } catch (primaryErr) {
      // Fallback model if primary model experiences temporary spike
      usedModel = fallbackModel;
      const model = genAI.getGenerativeModel({ model: fallbackModel });
      result = await model.generateContent("ping");
    }

    const text = result.response.text();
    return {
      ok: true,
      latencyMs: Math.round(now() - start),
      message: `Gemini API reachable (${usedModel}) — model responded (${text.length} chars)`,
      keyHint: redactKey(apiKey),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Math.round(now() - start),
      message: err instanceof Error ? err.message : "Gemini API check failed",
      keyHint: redactKey(apiKey),
    };
  }
}

async function checkPubMed(): Promise<ServiceResult> {
  const start = now();
  const ncbiKey = process.env.NCBI_API_KEY;

  const url = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
  );
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
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("abort"));
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

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  // Run all checks concurrently and independently
  const [clerk, supabase, gemini, pubmed] = await Promise.all([
    checkClerk(),
    checkSupabase(),
    checkGemini(),
    checkPubMed(),
  ]);

  const services = { clerk, supabase, gemini, pubmed };

  const results = Object.values(services);
  const okCount = results.filter((s) => s.ok).length;

  let status: HealthReport["status"];
  if (okCount === results.length) {
    status = "healthy";
  } else if (okCount === 0) {
    status = "unhealthy";
  } else {
    status = "degraded";
  }

  const report: HealthReport = {
    status,
    timestamp: new Date().toISOString(),
    services,
  };

  return NextResponse.json(report, { status: 200 });
}
