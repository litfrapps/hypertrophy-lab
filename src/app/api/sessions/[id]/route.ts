// ============================================
// Hypertrophy Lab — Session PATCH/DELETE by ID
// PATCH  /api/sessions/[id]  — update date/time
// DELETE /api/sessions/[id]  — delete session + all nested logs/sets
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase-server";

// ──────────────────────────────────────────
// PATCH /api/sessions/[id]
// Body: { date?: ISO string, durationSeconds?: number, logs?: WorkoutLog[] }
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
  const { date, logs, durationSeconds } = body;

  // If logs array is explicitly passed and is empty, delete the whole session
  if (Array.isArray(logs) && logs.length === 0) {
    const { data: dbLogs } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("session_id", id)
      .eq("user_id", userId);

    const logIds = (dbLogs ?? []).map((l: { id: string }) => l.id);
    if (logIds.length > 0) {
      await supabase.from("workout_sets").delete().in("log_id", logIds);
      await supabase.from("workout_logs").delete().eq("session_id", id).eq("user_id", userId);
    }
    await supabase.from("workout_sessions").delete().eq("id", id).eq("user_id", userId);
    return NextResponse.json({ success: true, deleted: true });
  }

  // Update session record if date or durationSeconds provided
  const sessionUpdate: Record<string, any> = {};
  if (date) sessionUpdate.date = date;
  if (durationSeconds !== undefined) sessionUpdate.duration_seconds = durationSeconds;

  if (Object.keys(sessionUpdate).length > 0) {
    const { error: sessErr } = await supabase
      .from("workout_sessions")
      .update(sessionUpdate)
      .eq("id", id)
      .eq("user_id", userId);

    if (sessErr) {
      console.error("[PATCH /api/sessions/:id]", sessErr);
      return NextResponse.json({ error: sessErr.message }, { status: 500 });
    }
  }

  // If logs are provided (e.g. from inline editing / removing exercises from session)
  if (Array.isArray(logs)) {
    // 1. Find existing logs in DB for this session
    const { data: existingLogs } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("session_id", id)
      .eq("user_id", userId);

    const existingLogIds = (existingLogs ?? []).map((l: { id: string }) => l.id);
    const incomingLogIds = new Set(logs.map((l: any) => l.id));

    // Determine which logs were deleted
    const toDeleteIds = existingLogIds.filter((lid) => !incomingLogIds.has(lid));
    if (toDeleteIds.length > 0) {
      await supabase.from("workout_sets").delete().in("log_id", toDeleteIds);
      await supabase.from("workout_logs").delete().in("id", toDeleteIds).eq("user_id", userId);
    }

    // 2. Upsert incoming logs and replace their sets
    for (const log of logs) {
      const { error: upsertErr } = await supabase.from("workout_logs").upsert({
        id: log.id,
        session_id: id,
        user_id: userId,
        date: log.date || date,
        exercise_id: log.exerciseId,
        exercise_name: log.exerciseName,
        unit: log.unit || "kg",
        notes: log.notes ?? null,
      });

      if (upsertErr) {
        console.error("[PATCH /api/sessions/:id] log upsert:", upsertErr);
      }

      // Replace sets for this log
      await supabase.from("workout_sets").delete().eq("log_id", log.id);

      const setsToInsert = (log.sets ?? []).map((s: any, idx: number) => ({
        log_id: log.id,
        set_number: s.setNumber || idx + 1,
        reps: Number(s.reps),
        weight: Number(s.weight),
      }));

      if (setsToInsert.length > 0) {
        const { error: setsErr } = await supabase.from("workout_sets").insert(setsToInsert);
        if (setsErr) {
          console.error("[PATCH /api/sessions/:id] sets insert:", setsErr);
        }
      }
    }
  } else if (date) {
    // If only date was provided without logs, propagate date to all logs
    const { error: logErr } = await supabase
      .from("workout_logs")
      .update({ date })
      .eq("session_id", id)
      .eq("user_id", userId);

    if (logErr) {
      console.error("[PATCH /api/sessions/:id] log date update:", logErr);
    }
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

  const logIds = (logs ?? []).map((l: { id: string }) => l.id);

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
