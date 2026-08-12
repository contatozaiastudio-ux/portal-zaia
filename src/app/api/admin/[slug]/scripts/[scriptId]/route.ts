import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteScript, updateScript } from "@/lib/data";
import { requireOwnedScript, jsonError } from "@/lib/admin-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; scriptId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, scriptId } = await params;
    await requireOwnedScript(slug, scriptId);
    const body = await request.json();
    await updateScript(scriptId, { title: body.title, content: body.content });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; scriptId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, scriptId } = await params;
    await requireOwnedScript(slug, scriptId);
    await deleteScript(scriptId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
