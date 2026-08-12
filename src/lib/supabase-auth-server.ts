import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie-bound Supabase client for the team's login session (Supabase Auth).
// Distinct from getSupabase() in supabase.ts, which uses the service_role
// key and has nothing to do with a user's session.
export async function createSupabaseAuthServer() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render; proxy.ts already
          // refreshes the session cookie on every request, so this is safe
          // to ignore here.
        }
      },
    },
  });
}

export async function getTeamUser() {
  const supabase = await createSupabaseAuthServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
