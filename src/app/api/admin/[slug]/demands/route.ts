import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createDemand } from "@/lib/data";
import { requireClient, jsonError } from "@/lib/admin-guard";
import type { DemandOrigin, TeamMember } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug } = await params;
    const client = await requireClient(slug);
    const body = await request.json();
    const description: string = (body.description ?? "").trim();
    if (!description) {
      return NextResponse.json({ error: "Descreva a demanda antes de adicionar" }, { status: 400 });
    }
    const demand = await createDemand({
      client_id: client.id,
      description,
      origin: body.origin as DemandOrigin,
      responsible: body.responsible as TeamMember,
    });
    return NextResponse.json({ demand });
  } catch (e) {
    return jsonError(e);
  }
}
