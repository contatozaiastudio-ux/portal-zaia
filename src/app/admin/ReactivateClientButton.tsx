"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReactivateClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reactivate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error("Erro ao reativar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={reactivate}
        disabled={loading}
        className="rounded-panel-sm border border-painel-border px-2.5 py-1 font-body text-fs-xs text-painel-text disabled:opacity-50"
      >
        {loading ? "..." : "Reativar"}
      </button>
      {error && <span className="font-body text-fs-2xs text-amarelo-deep">{error}</span>}
    </div>
  );
}
