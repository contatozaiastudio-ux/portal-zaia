"use client";

import { useRouter } from "next/navigation";

function formatMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MonthSelector({
  months,
  current,
  basePath,
  query,
  dark,
}: {
  months: string[];
  current: string;
  basePath: string;
  query?: Record<string, string>;
  dark?: boolean;
}) {
  const router = useRouter();
  const options = months.includes(current) ? months : [current, ...months];

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(query);
        params.set("m", e.target.value);
        router.push(`${basePath}?${params.toString()}`);
      }}
      className={
        dark
          ? "rounded-panel-md border border-painel-border bg-white/7 px-3 py-2 font-body text-fs-base text-painel-text"
          : "rounded-lg border border-azul-deep/30 bg-branco px-3 py-2 font-body text-sm text-ink"
      }
    >
      {options.map((m) => (
        <option key={m} value={m}>
          {formatMonthLabel(m)}
        </option>
      ))}
    </select>
  );
}
