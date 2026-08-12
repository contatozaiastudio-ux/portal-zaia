import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { upsertClientContext } from "@/lib/data";
import { requireClient, jsonError } from "@/lib/admin-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug } = await params;
    const client = await requireClient(slug);
    const body = await request.json();
    await upsertClientContext(client.id, {
      tone: (body.tone ?? "").trim(),
      target_audience: (body.target_audience ?? "").trim(),
      dont_do: (body.dont_do ?? "").trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
