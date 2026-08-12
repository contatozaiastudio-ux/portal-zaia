import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  clientTokenMatches,
  currentMonthKey,
  getClientBySlug,
  getMonthById,
  getScript,
  setScriptStatus,
} from "@/lib/data";
import type { PostStatus } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; scriptId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }

  const { slug, scriptId } = await params;
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

  const script = await getScript(scriptId);
  if (!script) {
    return NextResponse.json({ error: "Roteiro não encontrado" }, { status: 404 });
  }
  const month = await getMonthById(script.month_id);
  if (!month || month.client_id !== client.id) {
    return NextResponse.json({ error: "Roteiro não encontrado" }, { status: 404 });
  }
  if (month.month_key !== currentMonthKey()) {
    return NextResponse.json({ error: "Mês somente leitura" }, { status: 400 });
  }

  await setScriptStatus(scriptId, status, comment);
  const updated = await getScript(scriptId);
  return NextResponse.json({ script: updated });
}
