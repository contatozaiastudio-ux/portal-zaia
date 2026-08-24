import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { setClientCoverPosition } from "@/lib/data";
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
    await setClientCoverPosition(client.id, Number(body.positionY));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
