import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getClientBySlug, getClientLinks, mediaPublicUrl } from "@/lib/data";
import { LogoutButton } from "@/components/LogoutButton";
import { SetupNotice } from "@/components/SetupNotice";
import { ClientQuickLinks } from "@/components/ClientQuickLinks";
import { ClientCoverImage } from "@/components/ClientCoverImage";
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

  const links = await getClientLinks(client.id);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <ClientCoverImage
        slug={slug}
        initialUrl={client.cover_path ? mediaPublicUrl(client.cover_path) : null}
        initialPositionY={client.cover_position_y ?? 50}
      />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-painel-border px-6 py-4">
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
        <div className="flex flex-wrap items-center gap-3">
          <ClientQuickLinks links={links} />
          <LogoutButton className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text" />
        </div>
      </header>
      <ClientNavTabs slug={slug} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
