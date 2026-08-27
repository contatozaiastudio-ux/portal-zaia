import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteScript, setScriptStatus, updateScript } from "@/lib/data";
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

    if (body.status !== undefined) {
      // Only the team can move a script into "ajuste_feito" from here — the
      // client's own approve/ajustar transitions go through the client route.
      if (body.status !== "ajuste_feito") {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }
      await setScriptStatus(scriptId, "ajuste_feito", "");
      return NextResponse.json({ ok: true });
    }

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
