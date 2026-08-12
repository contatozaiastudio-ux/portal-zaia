"use client";

import { useRouter } from "next/navigation";
import { createSupabaseAuthBrowser } from "@/lib/supabase-auth-client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    const supabase = createSupabaseAuthBrowser();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button onClick={logout} className={className}>
      Sair
    </button>
  );
}
