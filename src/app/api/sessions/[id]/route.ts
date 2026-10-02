// ============================================
// Hypertrophy Lab — Session PATCH/DELETE by ID
// PATCH  /api/sessions/[id]  — update date/time
// DELETE /api/sessions/[id]  — delete session + all nested logs/sets
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase-server";

// ──────────────────────────────────────────
// PATCH /api/sessions/[id]
// Body: { date: ISO string }
// ──────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  if (!supabase || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { date } = body;

  // Update the session date
  const { error: sessErr } = await supabase
    .from("workout_sessions")
    .update({ date })
    .eq("id", id)
    .eq("user_id", userId);

  if (sessErr) {
    console.error("[PATCH /api/sessions/:id]", sessErr);
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  // Also propagate date to all logs in this session
  const { error: logErr } = await supabase
    .from("workout_logs")
    .update({ date })
    .eq("session_id", id)
    .eq("user_id", userId);

  if (logErr) {
    console.error("[PATCH /api/sessions/:id] log date update:", logErr);
  }

  return NextResponse.json({ success: true });
}

// ──────────────────────────────────────────
// DELETE /api/sessions/[id]
// ──────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  if (!supabase || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get log IDs so we can delete sets first (in case no CASCADE is set)
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("id")
    .eq("session_id", id)
    .eq("user_id", userId);

  const logIds = (logs ?? []).map((l: any) => l.id);

  if (logIds.length > 0) {
    // Delete sets
    await supabase.from("workout_sets").delete().in("log_id", logIds);
    // Delete logs
    await supabase
      .from("workout_logs")
      .delete()
      .eq("session_id", id)
      .eq("user_id", userId);
  }

  // Delete session
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[DELETE /api/sessions/:id]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
