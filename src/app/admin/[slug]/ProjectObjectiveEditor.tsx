"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectObjectiveEditor({
  slug,
  initialText,
}: {
  slug: string;
  initialText: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/objective`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Erro ao salvar objetivo");
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
          Objetivo do Projeto
        </span>
        <span className="font-body text-fs-2xs text-painel-text-muted">
          Visão de longo prazo da parceria — muda raramente. Diferente do Foco do mês, que fica no
          topo do Feed.
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-panel-md bg-azul px-4 py-1.5 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar objetivo"}
        </button>
        {saved && <span className="font-body text-fs-xs text-painel-text-muted">Salvo.</span>}
        {error && <span className="font-body text-fs-xs text-amarelo-deep">{error}</span>}
      </div>
    </section>
  );
}
