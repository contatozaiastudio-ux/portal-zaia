import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  clientTokenMatches,
  currentMonthKey,
  getClientBySlug,
  getMonth,
  getScriptsForMonth,
} from "@/lib/data";
import { Header } from "@/components/Header";
import { ClientPortalTabs } from "@/components/ClientPortalTabs";
import { StatusBadge } from "@/components/StatusBadge";
import { SetupNotice } from "@/components/SetupNotice";

export default async function ClientScriptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug } = await params;
  const { t: token } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client || !clientTokenMatches(client, token)) {
    notFound();
  }

  const monthKey = currentMonthKey();
  const month = await getMonth(client.id, monthKey);
  const scripts = month ? await getScriptsForMonth(month.id) : [];

  return (
    <div className="flex min-h-full flex-col">
      <Header clientName={client.name} />
      <ClientPortalTabs slug={slug} token={token} active="roteiros" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-8">
        <div className="rounded-2xl bg-amarelo-manteiga px-6 py-5 text-marrom-escuro">
          <p className="font-body text-sm leading-relaxed">
            Texto do carrossel para aprovar antes do design ser feito.
          </p>
        </div>

        {scripts.length === 0 ? (
          <p className="font-body text-sm text-ink/60">Nenhum roteiro cadastrado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {scripts.map((script) => (
              <li key={script.id}>
                <Link
                  href={`/${slug}/roteiros/${script.id}${token ? `?t=${token}` : ""}`}
                  className="flex flex-col gap-2 rounded-2xl border border-azul-deep/20 p-4 hover:border-azul-deep"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-sm font-semibold text-ink">
                      {script.title || "Sem título"}
                    </p>
                    <StatusBadge status={script.status} />
                  </div>
                  <p className="line-clamp-2 font-body text-sm text-ink/70">{script.content}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
