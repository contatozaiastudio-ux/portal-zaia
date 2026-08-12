import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deletePost, updatePost } from "@/lib/data";
import { requireOwnedPost, jsonError } from "@/lib/admin-guard";

export async function PATCH(
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
    await updatePost(postId, {
      type: body.type,
      caption: body.caption,
      scheduled_date: body.scheduled_date,
      media_link: body.media_link,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

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
    await deletePost(postId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
