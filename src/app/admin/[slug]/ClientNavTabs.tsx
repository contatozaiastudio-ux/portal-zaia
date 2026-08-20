"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClientNavTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/admin/${slug}`;

  const tabs = [
    { href: base, label: "Visão geral" },
    { href: `${base}/feed`, label: "Feed de aprovação" },
    { href: `${base}/roteiros`, label: "Roteiros" },
    { href: `${base}/etapa`, label: "Etapa do planejamento" },
    { href: `${base}/demandas`, label: "Demandas" },
  ];

  return (
    <nav className="border-b border-painel-border bg-black/15">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-2.5">
        {tabs.map((tab) => {
          const isActive = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-panel-md px-3.5 py-2 font-body text-fs-md font-semibold uppercase tracking-wide ${
                isActive ? "bg-azul text-marrom-escuro" : "text-painel-text-muted hover:text-painel-text"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
