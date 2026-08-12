import "server-only";
import { NextResponse } from "next/server";
import {
  getClientBySlug,
  getMediaPostId,
  getMonthById,
  getPost,
  getScopeItem,
  getScript,
} from "./data";
import { getTeamUser } from "./supabase-auth-server";
import type { Client, Month, Post, ScopeItem, Script } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// proxy.ts already redirects unauthenticated page loads under /admin/**, but
// that's an optimistic check only — every /api/admin/** route goes through
// requireClient() (directly or via requireOwnedPost/requireOwnedMedia), so
// checking the session here is what actually enforces it for API calls.
export async function requireTeamAuth(): Promise<void> {
  const user = await getTeamUser();
  if (!user) throw new ApiError(401, "Não autenticado");
}

export async function requireClient(slug: string): Promise<Client> {
  await requireTeamAuth();
  const client = await getClientBySlug(slug);
  if (!client) throw new ApiError(404, "Cliente não encontrado");
  return client;
}

export async function requireOwnedPost(
  slug: string,
  postId: string
): Promise<{ client: Client; post: Post; month: Month }> {
  const client = await requireClient(slug);
  const post = await getPost(postId);
  if (!post) throw new ApiError(404, "Post não encontrado");
  const month = await getMonthById(post.month_id);
  if (!month || month.client_id !== client.id) throw new ApiError(404, "Post não encontrado");
  return { client, post, month };
}

export async function requireOwnedMedia(
  slug: string,
  mediaId: string
): Promise<{ client: Client; post: Post; month: Month }> {
  const postId = await getMediaPostId(mediaId);
  if (!postId) throw new ApiError(404, "Mídia não encontrada");
  return requireOwnedPost(slug, postId);
}

export async function requireOwnedScopeItem(
  slug: string,
  scopeItemId: string
): Promise<{ client: Client; scopeItem: ScopeItem }> {
  const client = await requireClient(slug);
  const scopeItem = await getScopeItem(scopeItemId);
  if (!scopeItem || scopeItem.client_id !== client.id) {
    throw new ApiError(404, "Categoria de escopo não encontrada");
  }
  return { client, scopeItem };
}

export async function requireOwnedScript(
  slug: string,
  scriptId: string
): Promise<{ client: Client; script: Script; month: Month }> {
  const client = await requireClient(slug);
  const script = await getScript(scriptId);
  if (!script) throw new ApiError(404, "Roteiro não encontrado");
  const month = await getMonthById(script.month_id);
  if (!month || month.client_id !== client.id) throw new ApiError(404, "Roteiro não encontrado");
  return { client, script, month };
}

export function jsonError(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
