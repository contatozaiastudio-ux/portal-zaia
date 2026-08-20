import type { ClientLinks } from "@/lib/types";

const PILLS: Array<{ key: keyof ClientLinks; label: string }> = [
  { key: "notion_url", label: "Notion" },
  { key: "drive_url", label: "Drive" },
  { key: "canva_feed_url", label: "Canva · Feed" },
  { key: "canva_stories_url", label: "Canva · Stories" },
];

export function ClientQuickLinks({ links }: { links: ClientLinks | null }) {
  if (!links) return null;
  const visible = PILLS.filter((p) => links[p.key]);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((p) => (
        <a
          key={p.key}
          href={links[p.key] as string}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-painel-border bg-white/7 px-3 py-1 font-display text-fs-xs font-semibold text-painel-text hover:border-azul"
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}
