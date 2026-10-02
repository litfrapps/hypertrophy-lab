// ============================================
// Hypertrophy Lab — Supabase Client
// ============================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isMisconfigured =
  !supabaseUrl ||
  supabaseUrl === "YOUR_SUPABASE_PROJECT_URL" ||
  !supabaseAnonKey ||
  supabaseAnonKey === "YOUR_SUPABASE_ANON_PUBLIC_KEY";

if (isMisconfigured && typeof window === "undefined") {
  console.warn(
    "[HypertrophyLab] Supabase env vars not configured. " +
    "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
  );
}

/**
 * Creates a Supabase client.
 * Pass a Clerk JWT token to enable Row Level Security (RLS) for the current user.
 * Returns null if Supabase is not configured yet.
 */
export function createSupabaseClient(clerkToken?: string | null) {
  if (isMisconfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: clerkToken
        ? { Authorization: `Bearer ${clerkToken}` }
        : {},
    },
  });
}

// Default anon client (for server-side imports)
export const supabase = createSupabaseClient();
