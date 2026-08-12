"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScopeItem } from "@/lib/types";

const fieldClass =
  "rounded-panel-md border border-painel-border bg-white/7 p-2 text-left font-body text-fs-base text-painel-text";
const labelClass = "font-body text-fs-xs text-left text-painel-text-muted";

function ScopeItemCard({
  slug,
  item,
  onDeleted,
}: {
  slug: string;
  item: ScopeItem;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [cadence, setCadence] = useState(item.cadence);
  const [contentTypes, setContentTypes] = useState(item.content_types.join(", "));
  const [monthlyTarget, setMonthlyTarget] = useState(
    item.monthly_target === null ? "" : String(item.monthly_target)
  );
  const [notes, setNotes] = useState(item.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/scope-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          cadence,
          content_types: contentTypes
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          monthly_target: monthlyTarget ? Number(monthlyTarget) : null,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar categoria");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remover a categoria "${item.title}"?`)) return;
    onDeleted(item.id);
    await fetch(`/api/admin/${slug}/scope-items/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-panel border border-painel-border bg-black/10 p-4 text-left">
      <div className="flex flex-wrap gap-2.5">
        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className={labelClass}>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className={labelClass}>Cadência</span>
          <input
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            placeholder="ex: 2 a 3 por semana"
            className={fieldClass}
          />
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className={labelClass}>Meta mensal</span>
          <input
            type="number"
            min={0}
            value={monthlyTarget}
            onChange={(e) => setMonthlyTarget(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Tipos de conteúdo (separados por vírgula)</span>
        <input
          value={contentTypes}
          onChange={(e) => setContentTypes(e.target.value)}
          placeholder="ex: Reels, Carrossel"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Notas (opcional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldClass} />
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-panel-md bg-rosa px-3.5 py-1.5 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={remove} className="font-body text-fs-sm text-painel-text-muted hover:text-amarelo-deep">
          Remover
        </button>
        {error && <span className="font-body text-fs-xs text-amarelo-deep">{error}</span>}
      </div>
    </div>
  );
}

export function ScopeItemsEditor({
  slug,
  initialItems,
}: {
  slug: string;
  initialItems: ScopeItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function addItem() {
    if (!newTitle.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/scope-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar categoria");
      setItems((prev) => [...prev, data.scopeItem]);
      setNewTitle("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-panel border-l-[3px] border-rosa bg-painel-surface px-6 py-5 text-left">
      <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-rosa">
        Escopo Contratado
      </span>

      {items.length === 0 ? (
        <p className="font-body text-fs-sm text-left text-painel-text-muted">
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ScopeItemCard
              key={item.id}
              slug={slug}
              item={item}
              onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nome da nova categoria (ex: Reels)"
          className={`${fieldClass} flex-1 min-w-[200px]`}
        />
        <button
          onClick={addItem}
          disabled={adding || !newTitle.trim()}
          className="rounded-panel-md bg-rosa px-4 py-2 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          + Adicionar categoria
        </button>
      </div>
      {error && <p className="font-body text-fs-xs text-left text-amarelo-deep">{error}</p>}
    </section>
  );
}
