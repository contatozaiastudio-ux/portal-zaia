import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { updateDemandStatus } from "@/lib/data";
import { requireClient, jsonError } from "@/lib/admin-guard";
import type { DemandStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; demandId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug, demandId } = await params;
    const client = await requireClient(slug);
    const body = await request.json();
    await updateDemandStatus(demandId, body.status as DemandStatus, client.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
