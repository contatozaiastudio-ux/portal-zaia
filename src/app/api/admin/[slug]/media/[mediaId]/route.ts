import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { removeMedia } from "@/lib/data";
import { requireOwnedMedia, jsonError } from "@/lib/admin-guard";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; mediaId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, mediaId } = await params;
    await requireOwnedMedia(slug, mediaId);
    await removeMedia(mediaId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
