import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createScript, ensureMonth } from "@/lib/data";
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
    const monthKey: string = body.monthKey;
    const title: string = body.title ?? "";
    const content: string = body.content ?? "";

    const month = await ensureMonth(client.id, monthKey);
    const script = await createScript(month.id, { title, content });
    return NextResponse.json({ script });
  } catch (e) {
    return jsonError(e);
  }
}
