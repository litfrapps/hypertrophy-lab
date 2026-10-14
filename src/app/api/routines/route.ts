// ============================================
// Hypertrophy Lab — Routines API Route
// GET    /api/routines     — fetch all routines for current user
// POST   /api/routines     — create a routine
// PATCH  /api/routines/[id] — update a routine
// DELETE /api/routines/[id] — delete a routine
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase-server";

export async function GET() {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ routines: [] }, { status: 503 });
  if (!supabase || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("routines")
    .select("id, name, exercises")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/routines]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const routines = (data ?? []).map((r: { id: string; name: string; exercises: unknown }) => ({
    id: String(r.id),
    name: r.name,
    exerciseIds: Array.isArray(r.exercises)
      ? (r.exercises as unknown[]).map((e) =>
          typeof e === "string" ? e : typeof e === "object" && e !== null && "id" in e
            ? String((e as { id: unknown }).id)
            : ""
        )
      : [],
  }));

  return NextResponse.json(routines);
}

export async function POST(req: NextRequest) {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  if (!supabase || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, exerciseIds } = await req.json();

  const { error } = await supabase.from("routines").insert({
    id,
    user_id: userId,
    name,
    exercises: exerciseIds ?? [],
  });

  if (error) {
    console.error("[POST /api/routines]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
