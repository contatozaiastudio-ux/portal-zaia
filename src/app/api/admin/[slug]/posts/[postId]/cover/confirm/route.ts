import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { setPostCover } from "@/lib/data";
import { requireOwnedPost, jsonError } from "@/lib/admin-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, postId } = await params;
    await requireOwnedPost(slug, postId);
    const body = await request.json();
    await setPostCover(postId, body.path);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
