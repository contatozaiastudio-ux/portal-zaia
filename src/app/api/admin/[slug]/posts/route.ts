import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createPost, ensureMonth } from "@/lib/data";
import { requireClient, jsonError } from "@/lib/admin-guard";
import type { PostType } from "@/lib/types";

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
    const monthKey: string = body.monthKey;
    const type: PostType = body.type ?? "estatico";
    const caption: string = body.caption ?? "";
    const scheduled_date: string | null = body.scheduled_date ?? null;
    const script_id: string | null = body.script_id ?? null;

    const month = await ensureMonth(client.id, monthKey);
    const post = await createPost(month.id, { type, caption, scheduled_date, script_id });
    return NextResponse.json({ post });
  } catch (e) {
    return jsonError(e);
  }
}
