import Link from "next/link";

export function ClientPortalTabs({
  slug,
  token,
  active,
}: {
  slug: string;
  token?: string;
  active: "home" | "feed" | "roteiros";
}) {
  const qs = token ? `?t=${token}` : "";
  const tabs = [
    { key: "home", href: `/${slug}${qs}`, label: "Visão geral" },
    { key: "feed", href: `/${slug}/feed${qs}`, label: "Feed de aprovação" },
    { key: "roteiros", href: `/${slug}/roteiros${qs}`, label: "Roteiros" },
  ] as const;

  return (
    <nav className="border-b border-azul-deep/15 bg-azul/10">
      <div className="mx-auto flex max-w-6xl gap-1 px-6 py-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-full px-3.5 py-1.5 font-body text-sm font-semibold ${
              active === tab.key ? "bg-azul text-marrom-escuro" : "text-ink/60 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
