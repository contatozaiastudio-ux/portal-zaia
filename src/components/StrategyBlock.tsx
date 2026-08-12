export function StrategyBlock({
  objective,
  pillars,
}: {
  objective: string;
  pillars: string[];
}) {
  if (!objective && pillars.length === 0) return null;
  return (
    <section className="rounded-2xl bg-amarelo-manteiga px-6 py-5 text-marrom-escuro">
      {objective && (
        <p className="font-body text-sm leading-relaxed sm:text-base">{objective}</p>
      )}
      {pillars.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {pillars.slice(0, 3).map((pillar) => (
            <li
              key={pillar}
              className="rounded-full bg-marrom-escuro/10 px-3 py-1 font-display text-xs font-semibold"
            >
              {pillar}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
