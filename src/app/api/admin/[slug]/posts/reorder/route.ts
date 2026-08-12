import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { reorderPosts } from "@/lib/data";
import { requireOwnedPost, jsonError } from "@/lib/admin-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug } = await params;
    const body = await request.json();
    const orderedIds: string[] = body.orderedIds ?? [];
    await Promise.all(orderedIds.map((id) => requireOwnedPost(slug, id)));
    await reorderPosts(orderedIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
