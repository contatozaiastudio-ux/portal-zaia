const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function MiniCalendar({
  monthKey,
  scheduledDates,
}: {
  monthKey: string;
  scheduledDates: string[];
}) {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const datesWithPosts = new Set(scheduledDates);

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section className="flex w-full flex-col gap-2 rounded-panel border border-painel-border bg-painel-surface p-4">
      <h2 className="font-display text-fs-sm font-semibold text-painel-text">Calendário do mês</h2>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i} className="font-body text-fs-2xs uppercase text-painel-text-muted">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const hasPost = datesWithPosts.has(`${year}-${pad(month)}-${pad(day)}`);
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 py-0.5">
              <span className="font-body text-fs-xs text-painel-text">{day}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${hasPost ? "bg-amarelo" : "bg-white/10"}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
