import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getAgencyOverview,
  getCycleInfo,
  listAgencyEvents,
  listClientStages,
  listOpenDemandsAllClients,
} from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { LogoutButton } from "@/components/LogoutButton";
import { StageRing } from "@/components/StageRing";
import { StageBoard } from "@/components/StageBoard";
import { AgencyCalendar } from "@/components/AgencyCalendar";
import { ReactivateClientButton } from "./ReactivateClientButton";
import { AgencyDemandsPanel } from "./AgencyDemandsPanel";

// A client counts as "planejamento pronto" once it's reached Design or later
// — Aprovação is still a waiting stage, not a finished one.
const READY_STAGE_POSITION = 4;

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

  const [overview, demands, stages, events] = await Promise.all([
    getAgencyOverview(true),
    listOpenDemandsAllClients(),
    listClientStages(),
    listAgencyEvents(),
  ]);

  const active = overview.filter((o) => o.client.active);
  const inactiveClients = overview.filter((o) => !o.client.active);
  const sidebar = [...active].sort(
    (a, b) => b.adjustCount * 10 + b.openDemandCount - (a.adjustCount * 10 + a.openDemandCount)
  );

  const cycle = getCycleInfo();
  const atRisk = active.filter((o) => o.stage === "aberto" || o.stage === "escrita");

  const stageById = new Map(stages.map((s) => [s.id, s]));
  const readyCount = active.filter((o) => {
    const stage = stageById.get(o.client.client_stage_id);
    return stage && stage.position >= READY_STAGE_POSITION;
  }).length;

  return (
    <>
      <header className="flex items-center justify-between border-b border-painel-border px-6 py-4">
        <div>
          <p className="font-display text-fs-title font-semibold text-painel-text">ZAIA FLOW</p>
          <p className="font-body text-fs-xs text-painel-text-muted">Painel ZAIA Studio</p>
        </div>
        <LogoutButton className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text" />
      </header>

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-8 px-6 py-8 md:grid-cols-[190px_1fr_280px]">
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
            <h2 className="font-display text-fs-md font-semibold text-painel-text">ZAIA FLOW</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className="flex items-center gap-4 rounded-panel-md p-4"
                style={{ backgroundColor: "#EEF1F3" }}
              >
                <StageRing
                  value={cycle.elapsedDays}
                  total={cycle.totalDays}
                  color="#341614"
                  centerLabel={String(cycle.daysLeft)}
                />
                <div>
                  <p className="font-body text-fs-xs" style={{ color: "#5B6A71" }}>
                    Dias até a meta
                  </p>
                  <p className="font-body text-fs-md font-medium" style={{ color: "#3E4A50" }}>
                    Fecha dia {cycle.deadlineLabel}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-4 rounded-panel-md p-4"
                style={{ backgroundColor: "#EEF1F3" }}
              >
                <StageRing
                  value={readyCount}
                  total={active.length || 1}
                  color="#899AA2"
                  centerLabel={`${readyCount}/${active.length}`}
                  centerColor="#3E4A50"
                />
                <div>
                  <p className="font-body text-fs-xs" style={{ color: "#5B6A71" }}>
                    Planejamento pronto
                  </p>
                  <p className="font-body text-fs-md font-medium" style={{ color: "#3E4A50" }}>
                    {active.length - readyCount} cliente(s) pendente(s)
                  </p>
                </div>
              </div>
            </div>

            <p className="mb-2 mt-5 font-body text-fs-xs text-painel-text-muted">
              Clientes por etapa
            </p>
            <StageBoard stages={stages} clients={active.map((o) => o.client)} />

            {atRisk.length > 0 && (
              <p className="bg-painel-accent-surface border-painel-accent-border mt-4 rounded-panel-md border px-3 py-2.5 font-body text-fs-xs text-amarelo-manteiga">
                <strong>{atRisk.length} cliente(s) ainda em Aberto/Escrita neste mês:</strong>{" "}
                {atRisk.map((o) => o.client.name).join(", ")} — atenção pro prazo do dia 25.
              </p>
            )}
          </section>

          <AgencyDemandsPanel demands={demands} clients={active.map((o) => o.client)} />
        </div>

        <aside className="flex flex-col gap-6">
          <AgencyCalendar events={events} />
        </aside>
      </main>
    </>
  );
}
