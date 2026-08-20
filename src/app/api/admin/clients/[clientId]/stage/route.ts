import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { updateClientStage } from "@/lib/data";
import { requireTeamAuth, jsonError } from "@/lib/admin-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    await requireTeamAuth();
    const { clientId } = await params;
    const body = await request.json();
    const stageId: string | undefined = body.stageId;
    if (!stageId) {
      return NextResponse.json({ error: "stageId obrigatório" }, { status: 400 });
    }
    await updateClientStage(clientId, stageId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
