"use client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isBrowserUploadConfigured = Boolean(url && anonKey && !url.includes("YOUR-PROJECT"));

let client: SupabaseClient | null = null;

// Anon-key client used only for Storage uploads via signed upload URLs (see
// AdminPostEditor). Never used to query tables directly — every table has
// RLS enabled with no anon policies.
export function getSupabaseBrowser(): SupabaseClient {
  if (!isBrowserUploadConfigured) {
    throw new Error("Supabase ainda não configurado.");
  }
  if (!client) {
    client = createClient(url!, anonKey!, { auth: { persistSession: false } });
  }
  return client;
}
