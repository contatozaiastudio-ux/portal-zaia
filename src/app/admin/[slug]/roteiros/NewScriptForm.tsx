"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewScriptForm({ slug, monthKey }: { slug: string; monthKey: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-panel-md bg-bordo px-4 py-2 font-display text-fs-sm font-semibold text-branco"
      >
        + Novo roteiro
      </button>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthKey, title, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar roteiro");
      router.push(`/admin/${slug}/roteiros/${data.script.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-panel border border-painel-border bg-painel-surface p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título/tema do carrossel"
        className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Texto do roteiro, slide por slide"
        rows={4}
        className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
      />
      {error && <p className="font-body text-fs-sm text-amarelo-deep">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-panel-md bg-bordo px-4 py-1.5 font-display text-fs-xs font-semibold text-branco disabled:opacity-50"
        >
          {submitting ? "Criando..." : "Criar roteiro"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-panel-md px-4 py-1.5 font-display text-fs-xs font-semibold text-painel-text-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
