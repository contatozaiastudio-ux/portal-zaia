"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Script } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export function ScriptDetailClient({
  script,
  slug,
  token,
  editable,
  backHref,
}: {
  script: Script;
  slug: string;
  token: string;
  editable: boolean;
  backHref: string;
}) {
  const router = useRouter();
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitStatus(status: "aprovado" | "ajustar", commentText: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/${slug}/scripts/${script.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, status, comment: commentText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao atualizar o roteiro");
      }
      setShowAdjustForm(false);
      setComment("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href={backHref} className="font-body text-sm text-azul-deep hover:underline">
        ← Voltar para roteiros
      </Link>

      <div className="flex items-center gap-3">
        <StatusBadge status={script.status} />
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-amarelo-manteiga px-6 py-5 text-marrom-escuro">
        <h1 className="font-display text-base font-semibold">{script.title || "Sem título"}</h1>
        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed">{script.content}</p>
      </div>

      {editable ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-azul-deep/20 p-4">
          {error && <p className="font-body text-sm text-bordo">{error}</p>}
          {!showAdjustForm ? (
            <div className="flex gap-3">
              <button
                disabled={submitting}
                onClick={() => submitStatus("aprovado", "")}
                className="rounded-full bg-bordo px-5 py-2 font-display text-sm font-semibold text-branco disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                disabled={submitting}
                onClick={() => setShowAdjustForm(true)}
                className="rounded-full border border-bordo px-5 py-2 font-display text-sm font-semibold text-bordo disabled:opacity-50"
              >
                Solicitar ajuste
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="font-body text-sm text-ink/80">
                Descreva o que precisa ser ajustado no texto (obrigatório)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="rounded-lg border border-azul-deep/30 p-2 font-body text-sm"
              />
              <div className="flex gap-3">
                <button
                  disabled={submitting || !comment.trim()}
                  onClick={() => submitStatus("ajustar", comment)}
                  className="rounded-full bg-bordo px-5 py-2 font-display text-sm font-semibold text-branco disabled:opacity-50"
                >
                  Enviar ajuste
                </button>
                <button
                  disabled={submitting}
                  onClick={() => setShowAdjustForm(false)}
                  className="rounded-full px-5 py-2 font-display text-sm font-semibold text-ink/60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="font-body text-xs text-azul-deep">Mês anterior — somente leitura.</p>
      )}

      {script.comment_history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-semibold text-ink">Histórico</h2>
          <ul className="flex flex-col gap-2">
            {script.comment_history.map((h) => (
              <li key={h.id} className="rounded-lg border border-azul-deep/10 bg-branco p-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} />
                  <span className="font-body text-xs text-ink/50">
                    {new Date(h.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                {h.comment && <p className="mt-1 font-body text-sm text-ink/80">{h.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
