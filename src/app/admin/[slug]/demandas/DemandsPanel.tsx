"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Demand, DemandOrigin, DemandStatus, TeamMember } from "@/lib/types";
import { DEMAND_ORIGIN_LABEL, DEMAND_STATUS_LABEL, TEAM_MEMBER_LABEL } from "@/lib/types";

function DemandCard({
  demand,
  slug,
}: {
  demand: Demand;
  slug: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(demand.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(next: DemandStatus) {
    const previous = status;
    setStatus(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/demands/${demand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Erro ao salvar status");
      router.refresh();
    } catch (e) {
      setStatus(previous);
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  const statusColor =
    status === "aberta" ? "text-amarelo-deep" : status === "andamento" ? "text-amarelo" : "text-painel-text-muted";

  return (
    <div className="rounded-panel border border-painel-border bg-painel-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 font-body text-fs-md text-painel-text">{demand.description}</p>
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value as DemandStatus)}
          disabled={saving}
          className={`rounded-panel-sm border border-painel-border bg-white/7 px-2 py-1 font-body text-fs-xs font-semibold ${statusColor}`}
        >
          {(Object.keys(DEMAND_STATUS_LABEL) as DemandStatus[]).map((s) => (
            <option key={s} value={s}>
              {DEMAND_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 font-body text-fs-xs text-amarelo-deep">{error}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-painel-text-muted">
          {DEMAND_ORIGIN_LABEL[demand.origin]}
        </span>
        <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-painel-text-muted">
          {TEAM_MEMBER_LABEL[demand.responsible]}
        </span>
        <span className="rounded-panel-sm bg-white/8 px-2 py-1 font-body text-fs-2xs font-semibold text-painel-text-muted">
          {new Date(demand.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

export function DemandsPanel({ slug, demands }: { slug: string; demands: Demand[] }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState<DemandOrigin>("whatsapp");
  const [responsible, setResponsible] = useState<TeamMember>("ju");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addDemand() {
    if (!description.trim()) {
      setError("Descreva a demanda antes de adicionar.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/demands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, origin, responsible }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar demanda");
      setDescription("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...demands].sort((a, b) => (a.status === "concluida" ? 1 : 0) - (b.status === "concluida" ? 1 : 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-panel border border-dashed border-painel-border bg-painel-surface p-5">
        <h2 className="font-display text-fs-base font-semibold text-painel-text">
          Registrar nova demanda
        </h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva a demanda..."
          rows={2}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
        />
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-1 min-w-[140px] flex-col gap-1">
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
          <label className="flex flex-1 min-w-[140px] flex-col gap-1">
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
        <button
          onClick={addDemand}
          disabled={submitting}
          className="self-start rounded-panel-md bg-azul px-5 py-2 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          {submitting ? "Adicionando..." : "Adicionar demanda"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-fs-base font-semibold text-painel-text">
            Demandas registradas
          </h2>
          <span className="font-body text-fs-xs text-painel-text-muted">{demands.length} no total</span>
        </div>
        {sorted.length === 0 ? (
          <p className="font-body text-fs-sm text-painel-text-muted">
            Nenhuma demanda registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((d) => (
              <DemandCard key={d.id} demand={d} slug={slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
