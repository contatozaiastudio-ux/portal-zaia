"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScopeItem } from "@/lib/types";

function ChecklistRow({
  slug,
  monthKey,
  item,
  initialProduced,
}: {
  slug: string;
  monthKey: string;
  item: ScopeItem;
  initialProduced: number;
}) {
  const router = useRouter();
  const [produced, setProduced] = useState(String(initialProduced));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/admin/${slug}/scope-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey,
          scope_item_id: item.id,
          produced_count: Number(produced) || 0,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const target = item.monthly_target;
  const producedNum = Number(produced) || 0;
  const status =
    target == null ? null : producedNum >= target ? "Meta batida" : `Faltam ${target - producedNum}`;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-panel-md border border-painel-border bg-black/10 p-3">
      <span className="flex-1 min-w-[120px] font-body text-fs-base font-semibold text-painel-text">
        {item.title}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          value={produced}
          onChange={(e) => setProduced(e.target.value)}
          className="w-16 rounded-panel-md border border-painel-border bg-white/7 p-1.5 text-center font-body text-fs-base text-painel-text"
        />
        <span className="font-body text-fs-sm text-painel-text-muted">
          {target != null ? `/ ${target}` : "produzidos"}
        </span>
      </div>
      {status && (
        <span
          className={`font-body text-fs-xs font-semibold ${
            status === "Meta batida" ? "text-amarelo" : "text-painel-text-muted"
          }`}
        >
          {status}
        </span>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="rounded-panel-md bg-azul px-3 py-1.5 font-display text-fs-xs font-semibold text-marrom-escuro disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

export function ProductionChecklist({
  slug,
  monthKey,
  scopeItems,
  initialProgress,
}: {
  slug: string;
  monthKey: string;
  scopeItems: ScopeItem[];
  initialProgress: Record<string, { produced_count: number }>;
}) {
  if (scopeItems.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-panel border-l-[3px] border-rosa bg-painel-surface p-5">
        <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-rosa">
          Checklist de Produção do Mês
        </span>
        <p className="font-body text-fs-sm text-painel-text-muted">
          Cadastre categorias no Escopo Contratado (Visão geral) pra acompanhar a produção aqui.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-panel border-l-[3px] border-rosa bg-painel-surface p-5">
      <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-rosa">
        Checklist de Produção do Mês
      </span>
      <div className="flex flex-col gap-2.5">
        {scopeItems.map((item) => (
          <ChecklistRow
            key={item.id}
            slug={slug}
            monthKey={monthKey}
            item={item}
            initialProduced={initialProgress[item.id]?.produced_count ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
