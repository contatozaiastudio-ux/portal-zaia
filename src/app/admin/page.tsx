import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getAgencyOverview, listOpenDemandsAllClients } from "@/lib/data";
import {
  DEMAND_ORIGIN_LABEL,
  PLANNING_STAGE_LABEL,
  PLANNING_STAGE_ORDER,
} from "@/lib/types";
import { SetupNotice } from "@/components/SetupNotice";
import { LogoutButton } from "@/components/LogoutButton";
import { ReactivateClientButton } from "./ReactivateClientButton";

function deadline() {
  const today = new Date();
  let target = new Date(today.getFullYear(), today.getMonth(), 25);
  if (today.getDate() > 25) target = new Date(today.getFullYear(), today.getMonth() + 1, 25);
  const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const label = target.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return { days, label };
}

export default async function AdminIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { inactive } = await searchParams;
  const showInactive = inactive === "1";

  const [overview, demands] = await Promise.all([
    getAgencyOverview(true),
    listOpenDemandsAllClients(),
  ]);

  const active = overview.filter((o) => o.client.active);
  const inactiveClients = overview.filter((o) => !o.client.active);
  const sidebar = [...active].sort(
    (a, b) => b.adjustCount * 10 + b.openDemandCount - (a.adjustCount * 10 + a.openDemandCount)
  );

  const { days, label } = deadline();
  const stageCounts: Record<string, number> = { aberto: 0, escrita: 0, design: 0, aprovacao: 0 };
  active.forEach((o) => {
    stageCounts[o.stage] = (stageCounts[o.stage] ?? 0) + 1;
  });
  const atRisk = active.filter((o) => o.stage === "aberto" || o.stage === "escrita");

  return (
    <>
      <header className="flex items-center justify-between border-b border-painel-border px-6 py-4">
        <div>
          <p className="font-display text-fs-title font-semibold text-painel-text">ZAIA Studio</p>
          <p className="font-body text-fs-xs text-painel-text-muted">Painel ZAIA Studio</p>
        </div>
        <LogoutButton className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text" />
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-6 py-8 md:grid-cols-[190px_1fr]">
        <aside className="flex flex-col gap-1 md:border-r md:border-painel-border md:pr-4">
          <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-painel-text-muted">
            Clientes
          </span>
          {sidebar.map((o) => (
            <Link
              key={o.client.id}
              href={`/admin/${o.client.slug}`}
              className="flex items-center gap-2 rounded-panel-md px-2 py-2 font-body text-fs-sm text-painel-text hover:bg-white/6"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  o.adjustCount > 0 || o.openDemandCount > 1 ? "bg-amarelo-deep" : "bg-emerald-500"
                }`}
              />
              <span className="truncate">{o.client.name}</span>
              {!o.hasContext && (
                <span className="ml-auto shrink-0 rounded-panel-sm bg-white/8 px-1.5 py-0.5 font-body text-fs-2xs uppercase text-painel-text-muted">
                  pendente
                </span>
              )}
            </Link>
          ))}

          <Link
            href="/admin/new"
            className="mt-2 rounded-panel-md bg-bordo px-3 py-2 text-center font-display text-fs-xs font-semibold text-branco"
          >
            + Novo cliente
          </Link>

          {(inactiveClients.length > 0 || showInactive) && (
            <Link
              href={showInactive ? "/admin" : "/admin?inactive=1"}
              className="mt-1 font-body text-fs-2xs text-painel-text-muted hover:text-painel-text"
            >
              {showInactive ? "Ocultar inativos" : `Mostrar inativos (${inactiveClients.length})`}
            </Link>
          )}
        </aside>

        <div className="flex flex-col gap-8">
          {showInactive && inactiveClients.length > 0 && (
            <section className="flex flex-col gap-2 rounded-panel border border-painel-border bg-painel-surface p-4">
              <h2 className="font-display text-fs-sm font-semibold text-painel-text">
                Clientes inativos
              </h2>
              <ul className="flex flex-col gap-2">
                {inactiveClients.map((o) => (
                  <li key={o.client.id} className="flex items-center justify-between gap-3">
                    <span className="font-body text-fs-sm text-painel-text-muted">
                      {o.client.name}
                    </span>
                    <ReactivateClientButton clientId={o.client.id} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-panel border border-painel-border bg-painel-surface p-5">
            <h2 className="font-display text-fs-md font-semibold text-painel-text">
              ZAIA FLOW — Meta: aprovação até dia 25
            </h2>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-fs-hero font-bold text-amarelo">{days}</span>
              <span className="font-body text-fs-sm uppercase tracking-wide text-painel-text-muted">
                dia(s) até o prazo ({label})
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PLANNING_STAGE_ORDER.map((s) => (
                <div
                  key={s}
                  className={`min-w-[100px] flex-1 rounded-panel-md border border-painel-border px-2 py-2 text-center font-body text-fs-xs font-semibold ${
                    stageCounts[s] > 0 ? "bg-amarelo/15 text-amarelo" : "text-painel-text-muted"
                  }`}
                >
                  {PLANNING_STAGE_LABEL[s]} · {stageCounts[s]}
                </div>
              ))}
            </div>
            {atRisk.length > 0 && (
              <p className="mt-4 rounded-panel-md border-l-2 border-amarelo-deep bg-white/5 px-3 py-2.5 font-body text-fs-xs text-painel-text-muted">
                <strong className="text-amarelo-deep">
                  {atRisk.length} cliente(s) ainda em Aberto/Escrita:
                </strong>{" "}
                {atRisk.map((o) => o.client.name).join(", ")} — atenção pro prazo do dia 25.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="font-display text-fs-md font-semibold text-painel-text">
              Demandas abertas — todos os clientes
            </h2>
            {demands.length === 0 ? (
              <p className="font-body text-fs-sm text-painel-text-muted">
                Nenhuma demanda em aberto.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {demands.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-panel border border-painel-border bg-painel-surface p-3.5"
                  >
                    <p className="font-body text-fs-md text-painel-text">{d.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-amarelo">
                        {d.client_name}
                      </span>
                      <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-painel-text-muted">
                        {DEMAND_ORIGIN_LABEL[d.origin]}
                      </span>
                      <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-painel-text-muted">
                        {new Date(d.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
