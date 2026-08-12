import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { updateScopeItem, deleteScopeItem } from "@/lib/data";
import { requireOwnedScopeItem, jsonError } from "@/lib/admin-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, itemId } = await params;
    await requireOwnedScopeItem(slug, itemId);
    const body = await request.json();
    await updateScopeItem(itemId, {
      title: body.title,
      cadence: body.cadence,
      content_types: body.content_types,
      notes: body.notes,
      monthly_target: body.monthly_target === null ? null : Number(body.monthly_target),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, itemId } = await params;
    await requireOwnedScopeItem(slug, itemId);
    await deleteScopeItem(itemId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
