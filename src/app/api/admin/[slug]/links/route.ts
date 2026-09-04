import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { upsertClientLinks } from "@/lib/data";
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
    await upsertClientLinks(client.id, {
      notion_url: (body.notion_url ?? "").trim() || null,
      drive_url: (body.drive_url ?? "").trim() || null,
      canva_feed_url: (body.canva_feed_url ?? "").trim() || null,
      canva_stories_url: (body.canva_stories_url ?? "").trim() || null,
      pinterest_url: (body.pinterest_url ?? "").trim() || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
