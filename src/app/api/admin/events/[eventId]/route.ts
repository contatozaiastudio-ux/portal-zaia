import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteAgencyEvent } from "@/lib/data";
import { requireTeamAuth, jsonError } from "@/lib/admin-guard";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    await requireTeamAuth();
    const { eventId } = await params;
    await deleteAgencyEvent(eventId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
