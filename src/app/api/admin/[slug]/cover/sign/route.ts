import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createSignedClientCoverUpload } from "@/lib/data";
import { requireClient, jsonError } from "@/lib/admin-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }
  try {
    const { slug } = await params;
    await requireClient(slug);
    const body = await request.json();
    const fileName: string = body.fileName;
    const { path, token } = await createSignedClientCoverUpload(slug, fileName);
    return NextResponse.json({ path, token });
  } catch (e) {
    return jsonError(e);
  }
}
