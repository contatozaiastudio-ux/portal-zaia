"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StrategyEditor({
  slug,
  monthKey,
  initialObjective,
  initialPillars,
}: {
  slug: string;
  monthKey: string;
  initialObjective: string;
  initialPillars: string[];
}) {
  const router = useRouter();
  const [objective, setObjective] = useState(initialObjective);
  const [pillars, setPillars] = useState<string[]>([
    initialPillars[0] ?? "",
    initialPillars[1] ?? "",
    initialPillars[2] ?? "",
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Switching months (MonthSelector) keeps this same component mounted —
  // only the `m` search param changes — so the initial* props update but
  // useState's initial value doesn't re-run on its own. Sync it explicitly.
  useEffect(() => {
    setObjective(initialObjective);
    setPillars([initialPillars[0] ?? "", initialPillars[1] ?? "", initialPillars[2] ?? ""]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/months/${monthKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy_objective: objective,
          strategy_pillars: pillars.map((p) => p.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar estratégia");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-panel border-l-[3px] border-amarelo bg-painel-surface px-6 py-5">
      <label className="flex flex-col gap-1">
        <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-amarelo">
          Foco do mês
        </span>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={2}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
        />
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {pillars.map((pillar, i) => (
          <input
            key={i}
            value={pillar}
            onChange={(e) => {
              const next = [...pillars];
              next[i] = e.target.value;
              setPillars(next);
            }}
            placeholder={`Pilar ${i + 1}`}
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-panel-md bg-azul px-4 py-1.5 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar estratégia"}
        </button>
        {saved && <span className="font-body text-fs-xs text-painel-text-muted">Salvo.</span>}
        {error && <span className="font-body text-fs-xs text-amarelo-deep">{error}</span>}
      </div>
    </section>
  );
}
