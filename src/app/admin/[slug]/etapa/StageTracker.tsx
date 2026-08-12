"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanningStage } from "@/lib/types";
import { PLANNING_STAGE_LABEL, PLANNING_STAGE_ORDER } from "@/lib/types";

export function StageTracker({
  slug,
  monthKey,
  initialStage,
}: {
  slug: string;
  monthKey: string;
  initialStage: PlanningStage;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIdx = PLANNING_STAGE_ORDER.indexOf(stage);
  const percent = Math.round(((currentIdx + 1) / PLANNING_STAGE_ORDER.length) * 100);

  async function setAndSave(next: PlanningStage) {
    const previous = stage;
    setStage(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthKey, stage: next }),
      });
      if (!res.ok) throw new Error("Erro ao salvar etapa");
      router.refresh();
    } catch (e) {
      setStage(previous);
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-fs-hero font-bold text-amarelo">{percent}%</span>
        <span className="font-body text-fs-sm font-semibold uppercase tracking-wide text-painel-text-muted">
          {PLANNING_STAGE_LABEL[stage]}
        </span>
        {saving && <span className="font-body text-fs-xs text-painel-text-muted">salvando...</span>}
        {error && <span className="font-body text-fs-xs text-amarelo-deep">{error}</span>}
      </div>
      <div className="h-3.5 overflow-hidden rounded-panel bg-white/8">
        <div
          className="h-full rounded-panel bg-gradient-to-r from-azul to-amarelo transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PLANNING_STAGE_ORDER.map((s, idx) => {
          const isCurrent = s === stage;
          const isDone = idx < currentIdx;
          return (
            <button
              key={s}
              onClick={() => setAndSave(s)}
              className={`min-w-[110px] flex-1 rounded-panel-md border px-3 py-2.5 text-center font-body text-fs-xs font-semibold ${
                isCurrent
                  ? "border-azul bg-azul text-marrom-escuro"
                  : isDone
                    ? "border-amarelo/30 bg-amarelo/15 text-amarelo"
                    : "border-painel-border bg-painel-surface text-painel-text-muted"
              }`}
            >
              {PLANNING_STAGE_LABEL[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
