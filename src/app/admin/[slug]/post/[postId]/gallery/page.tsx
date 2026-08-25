import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getClientBySlug, getMonthById, getPost } from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";

export default async function PostGalleryPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug, postId } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const post = await getPost(postId);
  if (!post) notFound();
  const month = await getMonthById(post.month_id);
  if (!month || month.client_id !== client.id) notFound();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Link
        href={`/admin/${slug}/post/${postId}?m=${month.month_key}`}
        className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text"
      >
        ← Voltar pro post
      </Link>

      <div className="rounded-panel border border-painel-border bg-painel-surface p-4">
        <p className="font-display text-fs-sm font-semibold text-painel-text">{post.caption}</p>
        <p className="mt-1 font-body text-fs-xs text-painel-text-muted">
          Segure a imagem (ou o vídeo) e escolha &quot;Salvar na galeria/fotos&quot; pra baixar
          direto pro rolo da câmera.
        </p>
      </div>

      {post.media.length === 0 ? (
        <p className="font-body text-fs-sm text-painel-text-muted">
          Esse post não tem mídia enviada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {post.media.map((m, i) =>
            post.type === "video" ? (
              <video
                key={m.id}
                src={m.url}
                controls
                playsInline
                className="w-full rounded-panel-md border border-painel-border"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.id}
                src={m.url}
                alt={`${i + 1}/${post.media.length}`}
                className="w-full rounded-panel-md border border-painel-border"
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
