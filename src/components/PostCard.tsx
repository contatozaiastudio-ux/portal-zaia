import type { Post } from "@/lib/types";
import { POST_TYPE_LABEL } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function postCardBg(type: Post["type"]) {
  return type === "estatico" ? "bg-amarelo-deep" : "bg-amarelo-manteiga";
}

export function PostCardContent({ post }: { post: Post }) {
  const firstMedia = post.media[0];
  const videoCover = post.type === "video" ? post.cover_url : null;
  return (
    <div className={`relative aspect-square overflow-hidden rounded-2xl ${postCardBg(post.type)}`}>
      {videoCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={videoCover} alt={post.caption} className="h-full w-full object-cover" />
      ) : firstMedia ? (
        post.type === "video" ? (
          <video
            src={firstMedia.url}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={firstMedia.url} alt={post.caption} className="h-full w-full object-cover" />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-display text-xs font-semibold text-marrom-escuro/60">
            {POST_TYPE_LABEL[post.type]}
          </span>
        </div>
      )}

      <div className="absolute left-2 top-2">
        <StatusBadge status={post.status} />
      </div>

      {post.type === "carrossel" && post.media.length > 1 && (
        <span className="absolute bottom-2 right-2 rounded-full bg-marrom-escuro/70 px-2 py-0.5 font-display text-[10px] font-semibold text-branco">
          1/{post.media.length}
        </span>
      )}

      {post.scheduled_date && (
        <span className="absolute bottom-2 left-2 rounded-full bg-branco/80 px-2 py-0.5 font-body text-[11px] text-marrom-escuro">
          {new Date(post.scheduled_date + "T00:00:00").toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      )}
    </div>
  );
}
