import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  if (!supabase || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, exerciseIds } = await req.json();

  const { error } = await supabase
    .from("routines")
    .update({
      name,
      exercises: exerciseIds ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[PATCH /api/routines/:id]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  if (!supabase || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[DELETE /api/routines/:id]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
