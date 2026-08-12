import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { setClientActive } from "@/lib/data";
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
    if (typeof body.active === "boolean") {
      await setClientActive(clientId, body.active);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
