export function SetupNotice() {
  return (
    <div className="flex flex-1 items-center justify-center bg-branco px-6 py-16">
      <div className="max-w-md rounded-2xl border border-azul-deep/20 bg-amarelo-manteiga p-6 text-marrom-escuro">
        <h1 className="font-display text-lg font-semibold">Supabase ainda não configurado</h1>
        <p className="mt-2 font-body text-sm leading-relaxed">
          Defina <code className="rounded bg-marrom-escuro/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          e <code className="rounded bg-marrom-escuro/10 px-1">SUPABASE_SERVICE_ROLE_KEY</code> em{" "}
          <code className="rounded bg-marrom-escuro/10 px-1">.env.local</code>, rode{" "}
          <code className="rounded bg-marrom-escuro/10 px-1">supabase/schema.sql</code> e{" "}
          <code className="rounded bg-marrom-escuro/10 px-1">supabase/seed.sql</code> no projeto
          Supabase, e reinicie o servidor.
        </p>
      </div>
    </div>
  );
}
