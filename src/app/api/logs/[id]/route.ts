// ============================================
// Hypertrophy Lab — Individual Workout Log DELETE
// DELETE /api/logs/[id]  — delete a single workout log + its sets
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase-server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }
  if (!supabase || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Retrieve the session_id first so we can check if it becomes empty
  const { data: existingLog } = await supabase
    .from("workout_logs")
    .select("session_id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  // Delete sets first
  await supabase.from("workout_sets").delete().eq("log_id", id);

  // Delete log
  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[DELETE /api/logs/:id]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If the parent session has no remaining logs, remove the empty session
  if (existingLog?.session_id) {
    const { count } = await supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("session_id", existingLog.session_id);

    if (count === 0) {
      await supabase
        .from("workout_sessions")
        .delete()
        .eq("id", existingLog.session_id)
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({ success: true });
}
