"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PostType, Script } from "@/lib/types";

export function NewPostForm({
  slug,
  monthKey,
  scripts,
}: {
  slug: string;
  monthKey: string;
  scripts: Script[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>("estatico");
  const [caption, setCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scriptId, setScriptId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-panel-md bg-bordo px-4 py-2 font-display text-fs-sm font-semibold text-branco"
      >
        + Adicionar post
      </button>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey,
          type,
          caption,
          scheduled_date: scheduledDate || null,
          script_id: scriptId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar post");
      router.push(`/admin/${slug}/post/${data.post.id}?m=${monthKey}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-panel border border-painel-border bg-painel-surface p-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PostType)}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
        >
          <option value="estatico">Estático</option>
          <option value="carrossel">Carrossel</option>
          <option value="video">Vídeo</option>
        </select>
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
        />
      </div>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Legenda"
        rows={2}
        className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
      />
      {scripts.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">
            Vincular a um roteiro aprovado (opcional)
          </span>
          <select
            value={scriptId}
            onChange={(e) => setScriptId(e.target.value)}
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
          >
            <option value="">Nenhum</option>
            {scripts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || "Sem título"}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && <p className="font-body text-fs-sm text-amarelo-deep">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-panel-md bg-bordo px-4 py-1.5 font-display text-fs-xs font-semibold text-branco disabled:opacity-50"
        >
          {submitting ? "Criando..." : "Criar post"}
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
