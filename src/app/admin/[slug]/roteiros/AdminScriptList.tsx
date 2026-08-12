"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Script } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export function AdminScriptList({ slug, scripts }: { slug: string; scripts: Script[] }) {
  const router = useRouter();
  const [items, setItems] = useState(scripts);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    await fetch(`/api/admin/${slug}/scripts/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
    });
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="font-body text-fs-sm text-painel-text-muted">Nenhum roteiro cadastrado ainda.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((script, i) => (
        <li
          key={script.id}
          className="flex items-center gap-3 rounded-panel border border-painel-border bg-painel-surface p-4"
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="text-fs-sm text-painel-text-muted disabled:opacity-30"
            >
              ▲
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              className="text-fs-sm text-painel-text-muted disabled:opacity-30"
            >
              ▼
            </button>
          </div>
          <Link
            href={`/admin/${slug}/roteiros/${script.id}`}
            className="flex flex-1 flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-fs-base font-semibold text-painel-text">
                {script.title || "Sem título"}
              </p>
              <StatusBadge status={script.status} />
            </div>
            <p className="line-clamp-1 font-body text-fs-sm text-painel-text-muted">
              {script.content}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
