import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-branco px-6 text-center">
      <Logo className="h-12 w-12 text-ink" />
      <h1 className="font-display text-xl font-semibold text-ink">ZAIA FLOW</h1>
      <p className="max-w-md font-body text-sm text-ink/60">
        Acesse pelo link enviado pela equipe ZAIA, no formato
        <code className="mx-1 rounded bg-amarelo-manteiga px-1.5 py-0.5 text-marrom-escuro">
          /[cliente]?t=token
        </code>
        .
      </p>
    </div>
  );
}
