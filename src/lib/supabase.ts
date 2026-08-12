import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  url && serviceKey && !url.includes("YOUR-PROJECT")
);

let client: SupabaseClient | null = null;

// Server-only client authenticated with the service_role key. This app has
// no Supabase Auth, so every read/write goes through this trusted server
// client instead of RLS-scoped anon/user sessions.
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase ainda não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local."
    );
  }
  if (!client) {
    client = createClient(url!, serviceKey!, {
      auth: { persistSession: false },
    });
  }
  return client;
}
