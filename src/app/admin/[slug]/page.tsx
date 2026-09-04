import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getClientBySlug,
  getClientContext,
  getClientLinks,
  getProjectObjective,
  listClientStages,
  listScopeItems,
} from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { ProjectObjectiveEditor } from "./ProjectObjectiveEditor";
import { BrandPositioningEditor } from "./BrandPositioningEditor";
import { ClientContextEditor } from "./ClientContextEditor";
import { ClientLinksEditor } from "./ClientLinksEditor";
import { ScopeItemsEditor } from "./ScopeItemsEditor";
import { ClientStageTracker } from "./ClientStageTracker";

const NAV_CARDS = [
  { href: "feed", title: "Feed de aprovação", sub: "Foco do mês, grid e status de aprovação" },
  { href: "roteiros", title: "Roteiros", sub: "Aprovação do texto do carrossel antes do design" },
  { href: "etapa", title: "Etapa do planejamento", sub: "Aberto → Escrita → Design → Aprovação" },
  { href: "demandas", title: "Demandas", sub: "Pedidos avulsos fora do fluxo de aprovação" },
];

export default async function ClientHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const [stages, context, objective, scopeItems, links] = await Promise.all([
    listClientStages(),
    getClientContext(client.id),
    getProjectObjective(client.id),
    listScopeItems(client.id),
    getClientLinks(client.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-panel border border-painel-border bg-painel-surface p-5">
        <div>
          <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-azul">
            Etapa do planejamento
          </span>
          <p className="mt-1.5 font-body text-fs-sm text-painel-text-muted">
            Mesma etapa do quadro no painel principal — clique pra atualizar, atualiza nos dois
            lugares.
          </p>
        </div>
        <ClientStageTracker
          clientId={client.id}
          stages={stages}
          currentStageId={client.client_stage_id}
        />
      </section>

      <ProjectObjectiveEditor slug={slug} initialText={objective?.text ?? ""} />

      <BrandPositioningEditor slug={slug} initialText={objective?.positioning ?? ""} />

      <ClientContextEditor
        slug={slug}
        initialTone={context?.tone ?? ""}
        initialAudience={context?.target_audience ?? ""}
        initialDontDo={context?.dont_do ?? ""}
      />

      <ScopeItemsEditor slug={slug} initialItems={scopeItems} />

      <ClientLinksEditor
        slug={slug}
        initialNotion={links?.notion_url ?? ""}
        initialDrive={links?.drive_url ?? ""}
        initialCanvaFeed={links?.canva_feed_url ?? ""}
        initialCanvaStories={links?.canva_stories_url ?? ""}
        initialPinterest={links?.pinterest_url ?? ""}
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.href}
            href={`/admin/${slug}/${card.href}`}
            className="rounded-panel border border-painel-border bg-painel-surface p-4 hover:border-azul"
          >
            <p className="font-display text-fs-base font-semibold text-painel-text">
              {card.title}
            </p>
            <p className="mt-1 font-body text-fs-sm text-painel-text-muted">{card.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
