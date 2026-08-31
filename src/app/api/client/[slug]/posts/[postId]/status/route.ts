import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { clientTokenMatches, getClientBySlug, getMonthById, getPost, setPostStatus } from "@/lib/data";
import type { PostStatus } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }

  const { slug, postId } = await params;
  const body = await request.json();
  const token: string | undefined = body.token;
  const status: PostStatus | undefined = body.status;
  const comment: string = body.comment ?? "";

  const client = await getClientBySlug(slug);
  if (!client || !clientTokenMatches(client, token)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (status !== "aprovado" && status !== "ajustar") {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  if (status === "ajustar" && !comment.trim()) {
    return NextResponse.json({ error: "Comentário obrigatório para ajustes" }, { status: 400 });
  }

  const post = await getPost(postId);
  if (!post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }
  const month = await getMonthById(post.month_id);
  if (!month || month.client_id !== client.id) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  await setPostStatus(postId, status, comment);
  const updated = await getPost(postId);
  return NextResponse.json({ post: updated });
}
