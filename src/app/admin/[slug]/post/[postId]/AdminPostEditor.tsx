"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Post, PostMediaItem, PostType } from "@/lib/types";
import { getSupabaseBrowser, isBrowserUploadConfigured } from "@/lib/supabase-browser";
import { driveEmbedUrl, downloadUrl, mediaFileName, downloadAllMedia } from "@/lib/media-link";
import { StatusBadge } from "@/components/StatusBadge";

const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 200);

function SortableThumb({
  media,
  index,
  onDelete,
}: {
  media: PostMediaItem;
  index: number;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: media.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`relative h-20 w-20 shrink-0 cursor-grab touch-none overflow-hidden rounded-panel-md border border-painel-border active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt="" className="h-full w-full object-cover" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(media.id);
        }}
        className="absolute right-1 top-1 rounded-full bg-marrom-escuro/80 px-1.5 text-xs text-branco"
      >
        ×
      </button>
      <a
        href={downloadUrl(media.url, mediaFileName(media.storage_path, index))}
        download={mediaFileName(media.storage_path, index)}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-1 right-1 rounded-full bg-marrom-escuro/80 px-1.5 text-xs text-branco"
        title="Baixar"
      >
        ⬇
      </a>
    </div>
  );
}

export function AdminPostEditor({
  slug,
  monthKey,
  post,
}: {
  slug: string;
  monthKey: string;
  post: Post;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>(post.type);
  const [caption, setCaption] = useState(post.caption);
  const [scheduledDate, setScheduledDate] = useState(post.scheduled_date ?? "");
  const [mediaLink, setMediaLink] = useState(post.media_link ?? "");
  const [media, setMedia] = useState<PostMediaItem[]>(post.media);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(post.cover_url);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          caption,
          scheduled_date: scheduledDate || null,
          media_link: mediaLink || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar post");
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function markAdjustmentDone() {
    setResolving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/${slug}/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ajuste_feito" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao marcar ajuste como feito");
      }
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setResolving(false);
    }
  }

  async function deletePost() {
    if (!confirm("Excluir este post definitivamente?")) return;
    const res = await fetch(`/api/admin/${slug}/posts/${post.id}`, { method: "DELETE" });
    if (!res.ok) {
      setSaveError("Erro ao excluir post");
      return;
    }
    router.push(`/admin/${slug}?m=${monthKey}`);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!isBrowserUploadConfigured) {
      setUploadError("Supabase ainda não configurado para upload.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
          setUploadError(
            `"${file.name}" tem mais de ${MAX_UPLOAD_MB}MB. Use o campo de link externo (Drive/Canva) abaixo para esse arquivo.`
          );
          continue;
        }
        const signRes = await fetch(`/api/admin/${slug}/posts/${post.id}/media/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name }),
        });
        if (!signRes.ok) throw new Error("Falha ao preparar upload");
        const { path, token } = await signRes.json();

        const { error: uploadErr } = await getSupabaseBrowser()
          .storage.from("media")
          .uploadToSignedUrl(path, token, file);
        if (uploadErr) throw uploadErr;

        const confirmRes = await fetch(`/api/admin/${slug}/posts/${post.id}/media/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, position: media.length }),
        });
        if (!confirmRes.ok) throw new Error("Falha ao registrar mídia");
        const { media: newMedia } = await confirmRes.json();
        setMedia((prev) => [...prev, newMedia]);
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteMedia(mediaId: string) {
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    await fetch(`/api/admin/${slug}/media/${mediaId}`, { method: "DELETE" });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = media.findIndex((m) => m.id === active.id);
    const newIndex = media.findIndex((m) => m.id === over.id);
    const next = arrayMove(media, oldIndex, newIndex);
    setMedia(next);
    await fetch(`/api/admin/${slug}/media/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((m) => m.id) }),
    });
  }

  async function handleCoverFile(file: File | null) {
    if (!file) return;
    if (!isBrowserUploadConfigured) {
      setCoverError("Supabase ainda não configurado para upload.");
      return;
    }
    setCoverError(null);
    setCoverUploading(true);
    try {
      const signRes = await fetch(`/api/admin/${slug}/posts/${post.id}/cover/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      if (!signRes.ok) throw new Error("Falha ao preparar upload da capa");
      const { path, token } = await signRes.json();

      const { error: uploadErr } = await getSupabaseBrowser()
        .storage.from("media")
        .uploadToSignedUrl(path, token, file);
      if (uploadErr) throw uploadErr;

      const confirmRes = await fetch(`/api/admin/${slug}/posts/${post.id}/cover/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!confirmRes.ok) throw new Error("Falha ao registrar capa");

      const publicUrlRes = getSupabaseBrowser().storage.from("media").getPublicUrl(path);
      setCoverUrl(publicUrlRes.data.publicUrl);
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : "Erro no upload da capa");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function removeCover() {
    setCoverUrl(null);
    await fetch(`/api/admin/${slug}/posts/${post.id}/cover`, { method: "DELETE" });
  }

  const canUploadMore = type === "carrossel" || media.length === 0;
  const accept = type === "video" ? "video/*" : "image/*";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/${slug}/feed?m=${monthKey}`}
        className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text"
      >
        ← Voltar para o feed
      </Link>

      {post.status === "ajustar" && (
        <section className="flex flex-col gap-3 rounded-panel border border-bordo/40 bg-bordo/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={post.status} />
              <span className="font-body text-fs-sm text-painel-text">
                Aguardando ajuste pedido pelo cliente
              </span>
            </div>
            <button
              onClick={markAdjustmentDone}
              disabled={resolving}
              className="rounded-panel-md bg-rosa px-4 py-2 font-display text-fs-sm font-semibold text-branco disabled:opacity-50"
            >
              {resolving ? "Marcando..." : "✓ Marcar ajuste como feito"}
            </button>
          </div>
          {post.comment && (
            <p className="font-body text-fs-sm text-painel-text-muted">“{post.comment}”</p>
          )}
          {saveError && <p className="font-body text-fs-xs text-bordo">{saveError}</p>}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-panel border border-painel-border bg-painel-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-fs-sm font-semibold text-painel-text">Mídia</h2>
          {media.length > 0 && (
            <button
              onClick={() => downloadAllMedia(media)}
              className="rounded-panel-sm border border-azul px-2.5 py-1 font-body text-fs-2xs font-semibold text-azul hover:bg-azul hover:text-marrom-escuro"
            >
              ⬇ Baixar {media.length > 1 ? "tudo" : ""}
            </button>
          )}
        </div>

        <DndContext
          id="post-media-reorder"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={media.map((m) => m.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2">
              {media.map((m, i) => (
                <SortableThumb key={m.id} media={m} index={i} onDelete={deleteMedia} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {canUploadMore ? (
          <div className="flex flex-col gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={type === "carrossel"}
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
              className="font-body text-fs-sm text-painel-text"
            />
            <span className="font-body text-fs-xs text-painel-text-muted">
              Limite de {MAX_UPLOAD_MB}MB por vídeo. Arquivos maiores: use o link externo abaixo.
            </span>
          </div>
        ) : (
          <p className="font-body text-fs-xs text-painel-text-muted">
            Remova a mídia atual para enviar outra ({type === "video" ? "vídeo" : "post estático"}{" "}
            aceita apenas 1 arquivo).
          </p>
        )}
        {uploading && <p className="font-body text-fs-xs text-azul">Enviando...</p>}
        {uploadError && <p className="font-body text-fs-xs text-amarelo-deep">{uploadError}</p>}

        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">
            Link externo (Drive/Canva) — fallback para vídeos acima do limite
          </span>
          <input
            value={mediaLink}
            onChange={(e) => setMediaLink(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
          />
        </label>
        {mediaLink && (
          driveEmbedUrl(mediaLink) ? (
            <iframe src={driveEmbedUrl(mediaLink)!} allow="autoplay" className="h-64 w-full rounded-panel-md" />
          ) : (
            <p className="font-body text-fs-xs text-painel-text-muted">
              Esse link não é do Google Drive, então não dá pra mostrar o preview aqui — mas ele
              aparece como link clicável para o cliente.
            </p>
          )
        )}

        {type === "video" && (
          <div className="flex flex-col gap-2 border-t border-painel-border pt-3">
            <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-painel-text-muted">
              Capa (aparece no grid do feed)
            </span>
            {coverUrl ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-panel-md border border-painel-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={removeCover}
                  className="absolute right-1 top-1 rounded-full bg-marrom-escuro/80 px-1.5 text-fs-xs text-branco"
                >
                  ×
                </button>
              </div>
            ) : (
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
                disabled={coverUploading}
                className="font-body text-fs-sm text-painel-text"
              />
            )}
            {coverUploading && <p className="font-body text-fs-xs text-azul">Enviando capa...</p>}
            {coverError && <p className="font-body text-fs-xs text-amarelo-deep">{coverError}</p>}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-panel border border-painel-border bg-painel-surface p-4">
        <h2 className="font-display text-fs-sm font-semibold text-painel-text">Detalhes</h2>
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
          rows={3}
          placeholder="Legenda"
          className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text placeholder:text-painel-text-muted"
        />
        {saveError && <p className="font-body text-fs-sm text-amarelo-deep">{saveError}</p>}
        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-panel-md bg-azul px-5 py-2 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={deletePost}
            className="rounded-panel-md px-5 py-2 font-display text-fs-sm font-semibold text-painel-text-muted"
          >
            Excluir post
          </button>
        </div>
      </section>

      {post.comment_history.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-fs-sm font-semibold text-painel-text">
            Histórico de feedback
          </h2>
          <ul className="flex flex-col gap-2">
            {post.comment_history.map((h) => (
              <li
                key={h.id}
                className="rounded-panel-md border border-painel-border bg-white/5 p-3"
              >
                <div className="flex items-center gap-2 font-body text-fs-xs text-painel-text-muted">
                  <span>{h.status}</span>
                  <span>{new Date(h.created_at).toLocaleString("pt-BR")}</span>
                </div>
                {h.comment && (
                  <p className="mt-1 font-body text-fs-sm text-painel-text">{h.comment}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
