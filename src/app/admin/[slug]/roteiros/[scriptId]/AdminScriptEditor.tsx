"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Script } from "@/lib/types";

export function AdminScriptEditor({ slug, script }: { slug: string; script: Script }) {
  const router = useRouter();
  const [title, setTitle] = useState(script.title);
  const [content, setContent] = useState(script.content);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/scripts/${script.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar roteiro");
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function deleteScript() {
    if (!confirm("Excluir este roteiro definitivamente?")) return;
    const res = await fetch(`/api/admin/${slug}/scripts/${script.id}`, { method: "DELETE" });
    if (!res.ok) {
      setSaveError("Erro ao excluir roteiro");
      return;
    }
    router.push(`/admin/${slug}/roteiros`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/${slug}/roteiros`}
        className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text"
      >
        ← Voltar para roteiros
      </Link>

      <section className="flex flex-col gap-3 rounded-panel border border-painel-border bg-painel-surface p-4">
        <h2 className="font-display text-fs-sm font-semibold text-painel-text">Detalhes</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título/tema do carrossel"
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Texto do roteiro, slide por slide"
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
        />
        {saveError && <p className="font-body text-fs-sm text-amarelo-deep">{saveError}</p>}
        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-panel-md bg-bordo px-5 py-2 font-display text-fs-sm font-semibold text-branco disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={deleteScript}
            className="rounded-panel-md px-5 py-2 font-display text-fs-sm font-semibold text-painel-text-muted"
          >
            Excluir roteiro
          </button>
        </div>
      </section>

      {script.comment_history.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-fs-sm font-semibold text-painel-text">
            Histórico de feedback
          </h2>
          <ul className="flex flex-col gap-2">
            {script.comment_history.map((h) => (
              <li key={h.id} className="rounded-panel-md border border-painel-border bg-white/5 p-3">
                <div className="flex items-center gap-2 font-body text-fs-xs text-painel-text-muted">
                  <span>{h.status}</span>
                  <span>{new Date(h.created_at).toLocaleString("pt-BR")}</span>
                </div>
                {h.comment && <p className="mt-1 font-body text-fs-sm text-painel-text">{h.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
