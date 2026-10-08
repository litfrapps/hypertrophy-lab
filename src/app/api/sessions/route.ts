// ============================================
// Hypertrophy Lab — Sessions API Route
// GET    /api/sessions          — fetch all sessions for current user
// POST   /api/sessions          — create a new session (with nested logs)
// PATCH  /api/sessions/[id]     — update session date
// DELETE /api/sessions/[id]     — delete session + logs
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase-server";

interface DbWorkoutSet {
  set_number: number;
  reps: number | string;
  weight: number | string;
}

interface DbWorkoutLog {
  id: string;
  session_id: string;
  date: string;
  exercise_id: string;
  exercise_name: string;
  unit: string;
  notes?: string | null;
  workout_sets?: DbWorkoutSet[];
}

interface DbWorkoutSession {
  id: string;
  date: string;
  duration_seconds: number;
  notes?: string | null;
  workout_logs?: DbWorkoutLog[];
}

interface InputWorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
}

// ──────────────────────────────────────────
// GET /api/sessions
// ──────────────────────────────────────────
export async function GET() {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) {
    return NextResponse.json({ error: "Supabase not configured", sessions: [] }, { status: 503 });
  }
  if (!supabase || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch sessions with nested logs
  const { data: sessions, error: sessErr } = await supabase
    .from("workout_sessions")
    .select(`
      id,
      date,
      duration_seconds,
      notes,
      workout_logs (
        id,
        session_id,
        date,
        exercise_id,
        exercise_name,
        unit,
        notes,
        workout_sets (
          set_number,
          reps,
          weight
        )
      )
    `)
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (sessErr) {
    console.error("[GET /api/sessions]", sessErr);
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  // Transform snake_case DB rows → camelCase TypeScript shapes
  const transformed = (sessions ?? []).map((s: DbWorkoutSession) => ({
    id: s.id,
    date: s.date,
    durationSeconds: s.duration_seconds,
    notes: s.notes,
    logs: (s.workout_logs ?? []).map((l: DbWorkoutLog) => ({
      id: l.id,
      sessionId: l.session_id,
      date: l.date,
      exerciseId: l.exercise_id,
      exerciseName: l.exercise_name,
      unit: l.unit,
      notes: l.notes,
      sets: (l.workout_sets ?? [])
        .sort((a: DbWorkoutSet, b: DbWorkoutSet) => a.set_number - b.set_number)
        .map((st: DbWorkoutSet) => ({
          setNumber: st.set_number,
          reps: Number(st.reps),
          weight: Number(st.weight),
        })),
    })),
  }));

  return NextResponse.json(transformed);
}

// ──────────────────────────────────────────
// POST /api/sessions
// Body: WorkoutSession JSON
// ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  if (!supabase || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, date, durationSeconds, notes, logs } = body;

  // Insert session
  const { error: sessErr } = await supabase.from("workout_sessions").insert({
    id,
    user_id: userId,
    date,
    duration_seconds: durationSeconds ?? null,
    notes: notes ?? null,
  });

  if (sessErr) {
    console.error("[POST /api/sessions] session insert:", sessErr);
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  // Insert logs + sets for each log
  for (const log of logs ?? []) {
    const { error: logErr } = await supabase.from("workout_logs").insert({
      id: log.id,
      session_id: id,
      user_id: userId,
      date: log.date,
      exercise_id: log.exerciseId,
      exercise_name: log.exerciseName,
      unit: log.unit ?? "kg",
      notes: log.notes ?? null,
    });

    if (logErr) {
      console.error("[POST /api/sessions] log insert:", logErr);
      return NextResponse.json({ error: logErr.message }, { status: 500 });
    }

    // Insert sets for this log
    const setsToInsert = (log.sets ?? []).map((s: InputWorkoutSet) => ({
      log_id: log.id,
      set_number: s.setNumber,
      reps: s.reps,
      weight: s.weight,
    }));

    if (setsToInsert.length > 0) {
      const { error: setsErr } = await supabase
        .from("workout_sets")
        .insert(setsToInsert);

      if (setsErr) {
        console.error("[POST /api/sessions] sets insert:", setsErr);
        return NextResponse.json({ error: setsErr.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true, id });
}
