"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClientLinksEditor({
  slug,
  initialNotion,
  initialDrive,
  initialCanvaFeed,
  initialCanvaStories,
  initialPinterest,
}: {
  slug: string;
  initialNotion: string;
  initialDrive: string;
  initialCanvaFeed: string;
  initialCanvaStories: string;
  initialPinterest: string;
}) {
  const router = useRouter();
  const [notion, setNotion] = useState(initialNotion);
  const [drive, setDrive] = useState(initialDrive);
  const [canvaFeed, setCanvaFeed] = useState(initialCanvaFeed);
  const [canvaStories, setCanvaStories] = useState(initialCanvaStories);
  const [pinterest, setPinterest] = useState(initialPinterest);
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
          pinterest_url: pinterest,
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
        <LinkField label="Notion" value={notion} onChange={setNotion} placeholder="https://notion.so/..." />
        <LinkField label="Drive" value={drive} onChange={setDrive} placeholder="https://drive.google.com/..." />
        <LinkField
          label="Canva · Feed"
          value={canvaFeed}
          onChange={setCanvaFeed}
          placeholder="https://canva.com/design/..."
        />
        <LinkField
          label="Canva · Stories"
          value={canvaStories}
          onChange={setCanvaStories}
          placeholder="https://canva.com/design/..."
        />
        <LinkField
          label="Pinterest"
          value={pinterest}
          onChange={setPinterest}
          placeholder="https://pinterest.com/..."
        />
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

function LinkField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const trimmed = value.trim();
  const href = trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;

  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-fs-xs text-painel-text-muted">{label}</span>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
        />
        {trimmed && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center rounded-panel-md bg-azul px-3 font-display text-fs-xs font-semibold text-marrom-escuro hover:opacity-90"
          >
            Abrir ↗
          </a>
        )}
      </div>
    </label>
  );
}
