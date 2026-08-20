"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser, isBrowserUploadConfigured } from "@/lib/supabase-browser";

export function ClientCoverImage({
  slug,
  initialUrl,
}: {
  slug: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!isBrowserUploadConfigured) {
      setError("Supabase ainda não configurado para upload.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch(`/api/admin/${slug}/cover/sign`, {
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

      const confirmRes = await fetch(`/api/admin/${slug}/cover/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!confirmRes.ok) throw new Error("Falha ao registrar capa");

      const publicUrlRes = getSupabaseBrowser().storage.from("media").getPublicUrl(path);
      setCoverUrl(publicUrlRes.data.publicUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload da capa");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeCover() {
    setCoverUrl(null);
    await fetch(`/api/admin/${slug}/cover`, { method: "DELETE" });
    router.refresh();
  }

  if (!coverUrl) {
    return (
      <div className="border-b border-painel-border px-6 py-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-panel-md border border-dashed border-painel-border px-3 py-1.5 font-body text-fs-xs text-painel-text-muted hover:border-azul hover:text-painel-text">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
          {uploading ? "Enviando..." : "+ Adicionar imagem de capa"}
        </label>
        {error && <p className="mt-1 font-body text-fs-xs text-amarelo-deep">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative h-40 w-full sm:h-56">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={coverUrl} alt="" className="h-full w-full object-cover" />
      <div className="absolute bottom-3 right-3 flex gap-2">
        <label className="cursor-pointer rounded-panel-md bg-black/50 px-3 py-1.5 font-body text-fs-xs font-semibold text-branco backdrop-blur-sm hover:bg-black/65">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
          {uploading ? "Enviando..." : "Alterar capa"}
        </label>
        <button
          onClick={removeCover}
          className="rounded-panel-md bg-black/50 px-3 py-1.5 font-body text-fs-xs font-semibold text-branco backdrop-blur-sm hover:bg-black/65"
        >
          Remover
        </button>
      </div>
      {error && (
        <p className="absolute bottom-3 left-3 rounded-panel-md bg-black/50 px-3 py-1.5 font-body text-fs-xs text-amarelo backdrop-blur-sm">
          {error}
        </p>
      )}
    </div>
  );
}
