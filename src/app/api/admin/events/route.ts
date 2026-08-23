import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createAgencyEvent } from "@/lib/data";
import { requireTeamAuth, jsonError } from "@/lib/admin-guard";

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    await requireTeamAuth();
    const body = await request.json();
    const title: string = (body.title ?? "").trim();
    const eventDate: string = body.event_date ?? "";
    if (!title) {
      return NextResponse.json({ error: "Descreva o evento antes de adicionar" }, { status: 400 });
    }
    if (!eventDate) {
      return NextResponse.json({ error: "Escolha uma data" }, { status: 400 });
    }
    const event = await createAgencyEvent({
      title,
      event_date: eventDate,
      notes: (body.notes ?? "").trim(),
    });
    return NextResponse.json({ event });
  } catch (e) {
    return jsonError(e);
  }
}
