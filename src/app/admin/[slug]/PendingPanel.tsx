import Link from "next/link";
import type { Post } from "@/lib/types";
import { POST_TYPE_LABEL } from "@/lib/types";

export function PendingPanel({
  slug,
  posts,
}: {
  slug: string;
  posts: Array<Post & { month_key: string }>;
}) {
  return (
    <aside className="flex w-full flex-col gap-3 rounded-panel border border-amarelo-deep/40 bg-painel-surface p-4">
      <h2 className="font-display text-fs-sm font-semibold text-amarelo">
        Pendências ({posts.length})
      </h2>
      {posts.length === 0 ? (
        <p className="font-body text-fs-sm text-painel-text-muted">Nenhum ajuste pendente.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/${slug}/post/${post.id}?m=${post.month_key}`}
                className="block rounded-panel-md bg-amarelo-manteiga p-3 hover:opacity-90"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-fs-xs font-semibold text-marrom-escuro">
                    {POST_TYPE_LABEL[post.type]} · {post.month_key}
                  </span>
                </div>
                {post.comment && (
                  <p className="mt-1 font-body text-fs-xs text-marrom-escuro/80">{post.comment}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
