import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { setClientCover } from "@/lib/data";
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
    await setClientCover(client.id, body.path);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
