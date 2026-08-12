import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createScopeItem } from "@/lib/data";
import { requireClient, jsonError } from "@/lib/admin-guard";

export async function POST(
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

    const title: string = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    const scopeItem = await createScopeItem({
      client_id: client.id,
      title,
      cadence: (body.cadence ?? "").trim(),
      content_types: Array.isArray(body.content_types) ? body.content_types : [],
      notes: (body.notes ?? "").trim(),
      monthly_target: body.monthly_target ? Number(body.monthly_target) : null,
    });
    return NextResponse.json({ scopeItem });
  } catch (e) {
    return jsonError(e);
  }
}
