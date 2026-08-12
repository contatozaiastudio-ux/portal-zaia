import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ensureMonth, upsertScopeProgress } from "@/lib/data";
import { requireOwnedScopeItem, jsonError } from "@/lib/admin-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug } = await params;
    const body = await request.json();
    const monthKey: string = body.monthKey;
    const scopeItemId: string = body.scope_item_id;
    const producedCount = Number(body.produced_count) || 0;

    const { client } = await requireOwnedScopeItem(slug, scopeItemId);
    const month = await ensureMonth(client.id, monthKey);
    await upsertScopeProgress(month.id, scopeItemId, producedCount);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
