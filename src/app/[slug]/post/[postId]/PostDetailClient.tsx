"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { POST_TYPE_LABEL } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { driveEmbedUrl } from "@/lib/media-link";

export function PostDetailClient({
  post,
  slug,
  token,
  editable,
  backHref,
}: {
  post: Post;
  slug: string;
  token: string;
  editable: boolean;
  backHref: string;
}) {
  const router = useRouter();
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const media = post.media[mediaIndex];

  async function submitStatus(status: "aprovado" | "ajustar", commentText: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/${slug}/posts/${post.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, status, comment: commentText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao atualizar o post");
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
        ← Voltar para o feed
      </Link>

      <div className="overflow-hidden rounded-2xl bg-amarelo-manteiga">
        {media ? (
          post.type === "video" ? (
            <video
              src={media.url}
              controls
              playsInline
              poster={post.cover_url ?? undefined}
              className="max-h-[480px] w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt={post.caption} className="max-h-[480px] w-full object-contain" />
          )
        ) : post.media_link ? (
          driveEmbedUrl(post.media_link) ? (
            <iframe
              src={driveEmbedUrl(post.media_link)!}
              allow="autoplay"
              className="h-64 w-full sm:h-[480px]"
            />
          ) : (
            <div className="flex h-64 items-center justify-center p-6 text-center">
              <a
                href={post.media_link}
                target="_blank"
                rel="noreferrer"
                className="font-body text-sm text-bordo underline"
              >
                Ver mídia no link externo
              </a>
            </div>
          )
        ) : (
          <div className="flex h-64 items-center justify-center">
            <span className="font-body text-sm text-marrom-escuro/60">Sem mídia cadastrada</span>
          </div>
        )}
      </div>

      {post.type === "carrossel" && post.media.length > 1 && (
        <div className="flex gap-2">
          {post.media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setMediaIndex(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === mediaIndex ? "border-bordo" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-xs font-semibold uppercase tracking-wide text-azul-deep">
          {POST_TYPE_LABEL[post.type]}
        </span>
        <StatusBadge status={post.status} />
        {post.scheduled_date && (
          <span className="font-body text-xs text-ink/60">
            {new Date(post.scheduled_date + "T00:00:00").toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      <p className="font-body text-sm leading-relaxed text-ink">{post.caption}</p>

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
                Descreva o que precisa ser ajustado (obrigatório)
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

      {post.comment_history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-semibold text-ink">Histórico</h2>
          <ul className="flex flex-col gap-2">
            {post.comment_history.map((h) => (
              <li key={h.id} className="rounded-lg bg-branco border border-azul-deep/10 p-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} />
                  <span className="font-body text-xs text-ink/50">
                    {new Date(h.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                {h.comment && (
                  <p className="mt-1 font-body text-sm text-ink/80">{h.comment}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
