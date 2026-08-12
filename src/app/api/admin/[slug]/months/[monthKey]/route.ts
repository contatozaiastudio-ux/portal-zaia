import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ensureMonth, updateMonthStrategy } from "@/lib/data";
import { requireClient, jsonError } from "@/lib/admin-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; monthKey: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, monthKey } = await params;
    const client = await requireClient(slug);
    const body = await request.json();
    const month = await ensureMonth(client.id, monthKey);
    await updateMonthStrategy(
      month.id,
      body.strategy_objective ?? "",
      Array.isArray(body.strategy_pillars) ? body.strategy_pillars : []
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
