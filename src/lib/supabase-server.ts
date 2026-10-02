// ============================================
// Hypertrophy Lab — Supabase Server Client
// ============================================
// Provides authenticated Supabase access for Next.js Route Handlers.
// Automatically detects and supports:
//   1. SUPABASE_SERVICE_ROLE_KEY (Recommended: server-side, 0 Clerk JWT config needed)
//   2. Clerk "supabase" JWT template (if configured for RLS with anon key)
//   3. Standard anon key fallback

import { auth } from "@clerk/nextjs/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  if (
    !supabaseUrl ||
    supabaseUrl === "YOUR_SUPABASE_PROJECT_URL" ||
    !supabaseUrl.startsWith("http")
  ) {
    return false;
  }

  const hasValidAnonKey =
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== "YOUR_SUPABASE_ANON_PUBLIC_KEY";

  const hasValidServiceKey =
    Boolean(supabaseServiceKey) &&
    supabaseServiceKey !== "YOUR_SUPABASE_SERVICE_ROLE_KEY";

  return hasValidAnonKey || hasValidServiceKey;
}

export interface AuthenticatedSupabaseResult {
  supabase: SupabaseClient | null;
  userId: string | null;
  unconfigured: boolean;
}

/**
 * Retrieves an authenticated Supabase client for the current request.
 * Scoped to the authenticated Clerk user.
 */
export async function getAuthenticatedSupabase(): Promise<AuthenticatedSupabaseResult> {
  if (!isSupabaseConfigured()) {
    return { supabase: null, userId: null, unconfigured: true };
  }

  const { getToken, userId } = await auth();
  if (!userId) {
    return { supabase: null, userId: null, unconfigured: false };
  }

  // 1. If service role key is provided, use it (safest & simplest for server routes)
  if (
    supabaseServiceKey &&
    supabaseServiceKey !== "YOUR_SUPABASE_SERVICE_ROLE_KEY"
  ) {
    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return { supabase: client, userId, unconfigured: false };
  }

  // 2. Otherwise try to get Clerk JWT for Supabase RLS
  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
  } catch {
    // JWT template not configured in Clerk dashboard
    token = null;
  }

  // 3. Create client with token (or anon key fallback)
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  return { supabase: client, userId, unconfigured: false };
}
