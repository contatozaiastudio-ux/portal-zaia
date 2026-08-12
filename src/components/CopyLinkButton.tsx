"use client";

import { useState } from "react";

export function CopyLinkButton({ path, dark }: { path: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      className={
        dark
          ? "rounded-full border border-painel-border bg-white/7 px-3 py-1 font-display text-xs font-semibold text-painel-text"
          : "rounded-full border border-azul-deep/30 px-3 py-1 font-display text-xs font-semibold text-azul-deep"
      }
    >
      {copied ? "Copiado!" : "Copiar link do cliente"}
    </button>
  );
}
