import type { Post, PostType } from "@/lib/types";
import { POST_TYPE_LABEL } from "@/lib/types";

const TYPES: PostType[] = ["carrossel", "video", "estatico"];

export function CategoryCounts({ posts, dark }: { posts: Post[]; dark?: boolean }) {
  const counts = TYPES.map((type) => ({
    type,
    count: posts.filter((p) => p.type === type).length,
  }));

  return (
    <div className="flex flex-wrap gap-6">
      {counts.map(({ type, count }) => (
        <div key={type} className="flex items-baseline gap-2">
          <span
            className={`font-display text-2xl font-bold ${dark ? "text-amarelo" : "text-azul-deep"}`}
          >
            {count}
          </span>
          <span
            className={`font-body text-sm ${dark ? "text-painel-text-muted" : "text-ink/70"}`}
          >
            {POST_TYPE_LABEL[type]}
          </span>
        </div>
      ))}
    </div>
  );
}
