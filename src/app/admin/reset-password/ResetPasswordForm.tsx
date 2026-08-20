"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseAuthBrowser } from "@/lib/supabase-auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseAuthBrowser();

    function markReady() {
      readyRef.current = true;
      setReady(true);
    }

    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const hashError = hashParams.get("error_description") || searchParams.get("error_description");
    if (hashError) {
      const message = decodeURIComponent(hashError.replace(/\+/g, " "));
      queueMicrotask(() => setLinkError(message));
      return;
    }

    // Admin-generated recovery links always use the implicit flow (tokens
    // straight in the URL hash: #access_token=...&refresh_token=...) — they
    // can't use PKCE, since that requires a code_verifier only a real
    // requesting browser session would have. But createBrowserClient() from
    // @supabase/ssr hardcodes flowType: "pkce", so its automatic
    // detectSessionInUrl logic only ever looks for a ?code= query param and
    // silently ignores this hash. We have to parse it ourselves and set the
    // session explicitly.
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(
        ({ data, error }) => {
          if (error) setLinkError(error.message);
          else if (data.session) markReady();
        }
      );
    }

    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) setLinkError(error.message);
        else if (data.session) markReady();
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") markReady();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        setLinkError((current) => current ?? "expired");
      }
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseAuthBrowser();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-panel border border-painel-border bg-painel-surface p-6">
      <div>
        <h1 className="font-display text-fs-title font-semibold text-painel-text">ZAIA FLOW</h1>
        <p className="font-body text-fs-sm text-painel-text-muted">Definir sua senha</p>
      </div>

      {linkError ? (
        <p className="font-body text-fs-sm text-amarelo-deep">
          {linkError === "expired"
            ? "Esse link expirou ou já foi usado. Peça um link novo para a equipe."
            : `Não foi possível validar o link: ${linkError}`}
        </p>
      ) : !ready ? (
        <p className="font-body text-fs-sm text-painel-text-muted">
          Confirmando o link de acesso...
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-body text-fs-xs text-painel-text-muted">Nova senha</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-fs-xs text-painel-text-muted">Confirmar senha</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-base text-painel-text"
            />
          </label>
          {error && <p className="font-body text-fs-sm text-amarelo-deep">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-panel-md bg-azul px-4 py-2 font-display text-fs-sm font-semibold text-marrom-escuro disabled:opacity-50"
          >
            {submitting ? "Salvando..." : "Salvar senha e entrar"}
          </button>
        </form>
      )}
    </div>
  );
}
