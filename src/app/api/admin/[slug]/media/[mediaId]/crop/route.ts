import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cropPostVideoMedia } from "@/lib/data";
import { requireOwnedMedia, jsonError } from "@/lib/admin-guard";

// Video transcoding is slow — give it the most room Vercel allows instead
// of the default handler timeout.
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string; mediaId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, mediaId } = await params;
    await requireOwnedMedia(slug, mediaId);
    const media = await cropPostVideoMedia(mediaId);
    return NextResponse.json({ media });
  } catch (e) {
    return jsonError(e);
  }
}
