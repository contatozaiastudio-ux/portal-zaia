"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClientLinksEditor({
  slug,
  initialNotion,
  initialDrive,
  initialCanvaFeed,
  initialCanvaStories,
}: {
  slug: string;
  initialNotion: string;
  initialDrive: string;
  initialCanvaFeed: string;
  initialCanvaStories: string;
}) {
  const router = useRouter();
  const [notion, setNotion] = useState(initialNotion);
  const [drive, setDrive] = useState(initialDrive);
  const [canvaFeed, setCanvaFeed] = useState(initialCanvaFeed);
  const [canvaStories, setCanvaStories] = useState(initialCanvaStories);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/links`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notion_url: notion,
          drive_url: drive,
          canva_feed_url: canvaFeed,
          canva_stories_url: canvaStories,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar links");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-panel border border-painel-border bg-painel-surface p-4">
      <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-painel-text-muted">
        Links de acesso rápido
      </span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">Notion</span>
          <input
            value={notion}
            onChange={(e) => setNotion(e.target.value)}
            placeholder="https://notion.so/..."
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">Drive</span>
          <input
            value={drive}
            onChange={(e) => setDrive(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">Canva · Feed</span>
          <input
            value={canvaFeed}
            onChange={(e) => setCanvaFeed(e.target.value)}
            placeholder="https://canva.com/design/..."
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">Canva · Stories</span>
          <input
            value={canvaStories}
            onChange={(e) => setCanvaStories(e.target.value)}
            placeholder="https://canva.com/design/..."
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-panel-md bg-azul px-4 py-1.5 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar links"}
        </button>
        {saved && <span className="font-body text-fs-xs text-painel-text-muted">Salvo.</span>}
        {error && <span className="font-body text-fs-xs text-amarelo-deep">{error}</span>}
      </div>
    </section>
  );
}
