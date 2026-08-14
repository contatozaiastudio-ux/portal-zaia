import type { PostStatus } from "@/lib/types";
import { POST_STATUS_LABEL } from "@/lib/types";

const STYLE: Record<PostStatus, string> = {
  pendente: "bg-branco text-azul-deep border border-azul-deep/40",
  aprovado: "bg-azul-deep text-branco",
  ajustar: "bg-bordo text-branco",
  ajuste_feito: "bg-rosa text-branco",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-display text-xs font-semibold ${STYLE[status]}`}
    >
      {POST_STATUS_LABEL[status]}
    </span>
  );
}
