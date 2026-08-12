"use client";

import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
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
      className="rounded-full border border-azul-deep/30 px-3 py-1 font-display text-xs font-semibold text-azul-deep"
    >
      {copied ? "Copiado!" : "Copiar link do cliente"}
    </button>
  );
}
