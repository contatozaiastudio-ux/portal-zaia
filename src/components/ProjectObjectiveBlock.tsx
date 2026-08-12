export function ProjectObjectiveBlock({ text }: { text: string }) {
  if (!text) return null;
  return (
    <section className="rounded-2xl bg-amarelo-manteiga px-6 py-5 text-marrom-escuro">
      <span className="font-display text-xs font-bold uppercase tracking-widest text-marrom-escuro/70">
        Objetivo do Projeto
      </span>
      <p className="mt-1.5 font-body text-sm leading-relaxed sm:text-base">{text}</p>
    </section>
  );
}
