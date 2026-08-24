"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientStage } from "@/lib/types";

// Same client_stage_id the Kanban on the main dashboard reads/writes (see
// StageBoard.tsx) — this is a second control surface for that one field,
// not a separate tracker, so dragging a card there and clicking a step here
// always agree.
export function ClientStageTracker({
  clientId,
  stages,
  currentStageId,
}: {
  clientId: string;
  stages: ClientStage[];
  currentStageId: string;
}) {
  const router = useRouter();
  const [stageId, setStageId] = useState(currentStageId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ordered = [...stages].sort((a, b) => a.position - b.position);
  const currentIdx = ordered.findIndex((s) => s.id === stageId);
  const current = ordered[currentIdx];
  const percent = ordered.length ? Math.round(((currentIdx + 1) / ordered.length) * 100) : 0;

  async function setAndSave(next: ClientStage) {
    const previous = stageId;
    setStageId(next.id);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: next.id }),
      });
      if (!res.ok) throw new Error("Erro ao salvar etapa");
      router.refresh();
    } catch (e) {
      setStageId(previous);
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
          {current?.name ?? "—"}
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
        {ordered.map((s, idx) => {
          const isCurrent = s.id === stageId;
          const isDone = idx < currentIdx;
          return (
            <button
              key={s.id}
              onClick={() => setAndSave(s)}
              className={`min-w-[100px] flex-1 rounded-panel-md border px-3 py-2.5 text-center font-body text-fs-xs font-semibold ${
                isCurrent || isDone ? "" : "border-painel-border bg-painel-surface text-painel-text-muted"
              }`}
              style={
                isCurrent
                  ? { backgroundColor: s.color_bg, color: s.color_text, borderColor: s.color_bg }
                  : isDone
                    ? { backgroundColor: `${s.color_bg}26`, color: s.color_bg, borderColor: `${s.color_bg}4D` }
                    : undefined
              }
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
