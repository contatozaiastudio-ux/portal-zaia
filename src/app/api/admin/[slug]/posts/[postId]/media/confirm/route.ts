import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { addMediaToPost } from "@/lib/data";
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
    const media = await addMediaToPost(postId, body.path, body.position ?? 0);
    return NextResponse.json({ media });
  } catch (e) {
    return jsonError(e);
  }
}
