import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/supabase-server";

export async function GET() {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ preferred_unit: "kg" }, { status: 503 });
  if (!supabase || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_settings")
    .select("preferred_unit")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/settings]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferred_unit: data?.preferred_unit ?? "kg" });
}

export async function POST(req: NextRequest) {
  const { supabase, userId, unconfigured } = await getAuthenticatedSupabase();
  if (unconfigured) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  if (!supabase || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { preferred_unit } = await req.json();
  if (preferred_unit !== "kg" && preferred_unit !== "lbs") {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      preferred_unit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[POST /api/settings]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, preferred_unit });
}
