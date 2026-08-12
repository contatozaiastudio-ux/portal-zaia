import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { clearPostCover } from "@/lib/data";
import { requireOwnedPost, jsonError } from "@/lib/admin-guard";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, postId } = await params;
    await requireOwnedPost(slug, postId);
    await clearPostCover(postId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
