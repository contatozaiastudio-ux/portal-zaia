"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseAuthBrowser } from "@/lib/supabase-auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseAuthBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw new Error("E-mail ou senha incorretos");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-panel border border-painel-border bg-painel-surface p-6"
      >
        <div>
          <h1 className="font-display text-fs-title font-semibold text-painel-text">
            ZAIA Studio
          </h1>
          <p className="font-body text-fs-sm text-painel-text-muted">Painel da equipe</p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-fs-xs text-painel-text-muted">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
          />
        </label>
        {error && <p className="font-body text-fs-sm text-amarelo-deep">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-panel-md bg-azul px-4 py-2 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
