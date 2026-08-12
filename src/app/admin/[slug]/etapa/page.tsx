import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  currentMonthKey,
  getClientBySlug,
  getMonth,
  getScopeProgressForMonth,
  listScopeItems,
} from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { StageTracker } from "./StageTracker";
import { ProductionChecklist } from "./ProductionChecklist";

export default async function ClientStagePage({
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

  const monthKey = currentMonthKey();
  const [month, scopeItems] = await Promise.all([
    getMonth(client.id, monthKey),
    listScopeItems(client.id),
  ]);
  const progress = month ? await getScopeProgressForMonth(month.id) : {};

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-panel border-l-[3px] border-azul bg-painel-surface p-5">
        <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-azul">
          Etapa do planejamento
        </span>
        <p className="mt-1.5 font-body text-fs-md text-painel-text">
          Página visível só para a equipe ZAIA. Clique numa etapa para atualizar o status do mês.
        </p>
      </div>

      <StageTracker slug={slug} monthKey={monthKey} initialStage={month?.planning_stage ?? "aberto"} />

      <ProductionChecklist
        slug={slug}
        monthKey={monthKey}
        scopeItems={scopeItems}
        initialProgress={progress}
      />

      <Link
        href={`/admin/${slug}/roteiros`}
        className="self-start rounded-panel border border-painel-border bg-painel-surface px-4 py-3 font-body text-fs-sm font-semibold text-painel-text hover:border-azul"
      >
        → Ir para Roteiros
      </Link>
    </div>
  );
}
