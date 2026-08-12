"use client";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for the team's login session — persists the session in
// cookies (not localStorage) so proxy.ts and Server Components can read it
// on the next request. Only used by the login/logout UI.
export function createSupabaseAuthBrowser() {
  return createBrowserClient(url, anonKey);
}
