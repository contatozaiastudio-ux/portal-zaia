"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fieldClass =
  "rounded-panel-md border border-painel-border bg-white/7 p-2.5 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted";
const labelClass = "font-body text-fs-xs font-semibold text-painel-text-muted";

export function NewClientChecklistForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [dontDo, setDontDo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!name.trim()) missing.push("Nome do cliente");
    if (!tone.trim()) missing.push("Tom de voz");
    if (!audience.trim()) missing.push("Público-alvo");
    if (!dontDo.trim()) missing.push("O que não fazer");
    if (missing.length > 0) {
      setError(`Faltou preencher: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tone,
          target_audience: audience,
          dont_do: dontDo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar cliente");
      router.push(`/admin/${data.client.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-panel border border-dashed border-painel-border bg-painel-surface p-5"
    >
      <h2 className="font-display text-fs-base font-semibold text-painel-text">
        Dados obrigatórios
      </h2>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Nome do cliente *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Tom de voz *</span>
        <textarea value={tone} onChange={(e) => setTone(e.target.value)} rows={2} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Público-alvo *</span>
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          rows={2}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>O que não fazer *</span>
        <textarea value={dontDo} onChange={(e) => setDontDo(e.target.value)} rows={2} className={fieldClass} />
      </label>

      {error && <p className="font-body text-fs-sm text-amarelo-deep">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-panel-md bg-azul px-5 py-2.5 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
      >
        {submitting ? "Adicionando..." : "Adicionar cliente"}
      </button>
    </form>
  );
}
