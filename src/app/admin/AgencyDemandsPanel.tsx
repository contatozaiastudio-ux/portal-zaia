"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client, Demand, DemandOrigin, TeamMember } from "@/lib/types";
import { DEMAND_ORIGIN_LABEL, TEAM_MEMBER_LABEL } from "@/lib/types";

type AgencyDemand = Demand & { client_name: string; client_slug: string };

function DemandRow({ demand }: { demand: AgencyDemand }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${demand.client_slug}/demands/${demand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "concluida" }),
      });
      if (!res.ok) throw new Error("Erro ao concluir demanda");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (done) return null;

  return (
    <li className="rounded-panel border border-painel-border bg-painel-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 font-body text-fs-md text-painel-text">{demand.description}</p>
        <button
          onClick={complete}
          disabled={saving}
          className="shrink-0 rounded-panel-sm border border-azul px-2.5 py-1 font-body text-fs-2xs font-semibold text-azul hover:bg-azul hover:text-marrom-escuro disabled:opacity-50"
        >
          {saving ? "..." : "✓ Concluir"}
        </button>
      </div>
      {error && <p className="mt-1 font-body text-fs-xs text-amarelo-deep">{error}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-amarelo">
          {demand.client_name}
        </span>
        <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-painel-text-muted">
          {DEMAND_ORIGIN_LABEL[demand.origin]}
        </span>
        <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-painel-text-muted">
          {new Date(demand.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </li>
  );
}

export function AgencyDemandsPanel({
  demands,
  clients,
}: {
  demands: AgencyDemand[];
  clients: Client[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientSlug, setClientSlug] = useState(clients[0]?.slug ?? "");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState<DemandOrigin>("whatsapp");
  const [responsible, setResponsible] = useState<TeamMember>("ju");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addDemand() {
    if (!clientSlug) {
      setError("Escolha o cliente antes de adicionar.");
      return;
    }
    if (!description.trim()) {
      setError("Descreva a demanda antes de adicionar.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${clientSlug}/demands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, origin, responsible }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar demanda");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-fs-md font-semibold text-painel-text">
          Demandas abertas — todos os clientes
        </h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-panel-md bg-bordo px-3 py-1.5 font-display text-fs-xs font-semibold text-branco"
          >
            + Nova demanda
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-3 rounded-panel border border-dashed border-painel-border bg-painel-surface p-5">
          <label className="flex flex-col gap-1">
            <span className="font-body text-fs-xs text-painel-text-muted">Cliente</span>
            <select
              value={clientSlug}
              onChange={(e) => setClientSlug(e.target.value)}
              className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a demanda..."
            rows={2}
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
          />
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[140px] flex-1 flex-col gap-1">
              <span className="font-body text-fs-xs text-painel-text-muted">Origem</span>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as DemandOrigin)}
                className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
              >
                {(Object.keys(DEMAND_ORIGIN_LABEL) as DemandOrigin[]).map((o) => (
                  <option key={o} value={o}>
                    {DEMAND_ORIGIN_LABEL[o]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[140px] flex-1 flex-col gap-1">
              <span className="font-body text-fs-xs text-painel-text-muted">Responsável</span>
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value as TeamMember)}
                className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
              >
                {(Object.keys(TEAM_MEMBER_LABEL) as TeamMember[]).map((m) => (
                  <option key={m} value={m}>
                    {TEAM_MEMBER_LABEL[m]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="font-body text-fs-sm text-amarelo-deep">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={addDemand}
              disabled={submitting}
              className="self-start rounded-panel-md bg-azul px-5 py-2 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
            >
              {submitting ? "Adicionando..." : "Adicionar demanda"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="self-start rounded-panel-md px-5 py-2 font-display text-fs-sm font-semibold text-painel-text-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {demands.length === 0 ? (
        <p className="font-body text-fs-sm text-painel-text-muted">Nenhuma demanda em aberto.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {demands.map((d) => (
            <DemandRow key={d.id} demand={d} />
          ))}
        </ul>
      )}
    </section>
  );
}
