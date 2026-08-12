import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getClientBySlug } from "@/lib/data";
import { LogoutButton } from "@/components/LogoutButton";
import { SetupNotice } from "@/components/SetupNotice";
import { ClientNavTabs } from "./ClientNavTabs";

export default async function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-painel-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text"
          >
            ← Painel
          </Link>
          <span className="text-painel-border">|</span>
          <p className="font-display text-fs-title font-semibold text-painel-text">
            {client.name}
          </p>
        </div>
        <LogoutButton className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text" />
      </header>
      <ClientNavTabs slug={slug} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
