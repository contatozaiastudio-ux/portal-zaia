import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createSignedMediaUpload } from "@/lib/data";
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
    const { month } = await requireOwnedPost(slug, postId);
    const body = await request.json();
    const fileName: string = body.fileName;
    const { path, token } = await createSignedMediaUpload(slug, month.month_key, postId, fileName);
    return NextResponse.json({ path, token });
  } catch (e) {
    return jsonError(e);
  }
}
