import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createClientWithContext } from "@/lib/data";
import { requireTeamAuth, jsonError } from "@/lib/admin-guard";

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    await requireTeamAuth();
    const body = await request.json();

    const name: string = (body.name ?? "").trim();
    const tone: string = (body.tone ?? "").trim();
    const target_audience: string = (body.target_audience ?? "").trim();
    const dont_do: string = (body.dont_do ?? "").trim();

    const missing: string[] = [];
    if (!name) missing.push("Nome do cliente");
    if (!tone) missing.push("Tom de voz");
    if (!target_audience) missing.push("Público-alvo");
    if (!dont_do) missing.push("O que não fazer");
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltou preencher: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const client = await createClientWithContext({ name, tone, target_audience, dont_do });
    return NextResponse.json({ client });
  } catch (e) {
    return jsonError(e);
  }
}
