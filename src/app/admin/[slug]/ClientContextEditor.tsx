"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClientContextEditor({
  slug,
  initialTone,
  initialAudience,
  initialDontDo,
}: {
  slug: string;
  initialTone: string;
  initialAudience: string;
  initialDontDo: string;
}) {
  const router = useRouter();
  const [tone, setTone] = useState(initialTone);
  const [audience, setAudience] = useState(initialAudience);
  const [dontDo, setDontDo] = useState(initialDontDo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = !initialTone || !initialAudience || !initialDontDo;

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/context`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone, target_audience: audience, dont_do: dontDo }),
      });
      if (!res.ok) throw new Error("Erro ao salvar contexto");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-panel border-l-[3px] border-azul bg-painel-surface px-6 py-5">
      <div className="flex items-center gap-2">
        <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-azul">
          Contexto do Cliente
        </span>
        {pending && (
          <span className="rounded-panel-sm bg-white/8 px-1.5 py-0.5 font-body text-fs-2xs uppercase text-painel-text-muted">
            pendente
          </span>
        )}
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-body text-fs-xs text-painel-text-muted">Tom de voz</span>
        <textarea
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          rows={2}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-body text-fs-xs text-painel-text-muted">Público-alvo</span>
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          rows={2}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-body text-fs-xs text-painel-text-muted">O que não fazer</span>
        <textarea
          value={dontDo}
          onChange={(e) => setDontDo(e.target.value)}
          rows={2}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-panel-md bg-azul px-4 py-1.5 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar contexto"}
        </button>
        {saved && <span className="font-body text-fs-xs text-painel-text-muted">Salvo.</span>}
        {error && <span className="font-body text-fs-xs text-amarelo-deep">{error}</span>}
      </div>
    </section>
  );
}
