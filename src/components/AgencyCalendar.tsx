"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AgencyEvent } from "@/lib/types";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function AgencyCalendar({ events: initialEvents }: { events: AgencyEvent[] }) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AgencyEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.event_date) ?? [];
      list.push(ev);
      map.set(ev.event_date, list);
    }
    return map;
  }, [events]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function changeMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDate(null);
  }

  function pickDay(day: number) {
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    setSelectedDate(selectedDate === key ? null : key);
    setTitle("");
    setNotes("");
    setError(null);
  }

  async function addEvent() {
    if (!selectedDate) return;
    if (!title.trim()) {
      setError("Descreva o evento.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, event_date: selectedDate, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar evento");
      setEvents((prev) => [...prev, data.event]);
      setTitle("");
      setNotes("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const today = todayKey();
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  const upcoming = [...events]
    .filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5);

  return (
    <section className="flex w-full flex-col gap-3 rounded-panel border border-painel-border bg-painel-surface p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="rounded-panel-sm px-2 py-1 font-body text-fs-sm text-painel-text-muted hover:text-painel-text"
        >
          ←
        </button>
        <h2 className="font-display text-fs-sm font-semibold text-painel-text">
          {MONTH_LABELS[month]} {year}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="rounded-panel-sm px-2 py-1 font-body text-fs-sm text-painel-text-muted hover:text-painel-text"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i} className="font-body text-fs-2xs uppercase text-painel-text-muted">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = key === today;
          const isSelected = key === selectedDate;
          return (
            <button
              key={i}
              onClick={() => pickDay(day)}
              className={`flex flex-col items-center gap-0.5 rounded-panel-sm py-1 ${
                isSelected ? "bg-azul" : isToday ? "bg-white/8" : "hover:bg-white/6"
              }`}
            >
              <span
                className={`font-body text-fs-xs ${isSelected ? "text-marrom-escuro font-semibold" : "text-painel-text"}`}
              >
                {day}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${dayEvents.length > 0 ? "bg-amarelo" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="flex flex-col gap-2 rounded-panel-md border border-painel-border bg-white/5 p-3">
          <span className="font-body text-fs-xs font-semibold text-painel-text">
            {selectedDate.split("-").reverse().join("/")}
          </span>

          {selectedEvents.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {selectedEvents.map((ev) => (
                <li key={ev.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-body text-fs-sm text-painel-text">{ev.title}</p>
                    {ev.notes && (
                      <p className="font-body text-fs-2xs text-painel-text-muted">{ev.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeEvent(ev.id)}
                    className="shrink-0 font-body text-fs-2xs text-painel-text-muted hover:text-amarelo-deep"
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do evento/gravação"
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-sm text-painel-text placeholder:text-painel-text-muted"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            rows={2}
            className="rounded-panel-md border border-painel-border bg-white/7 p-2 font-body text-fs-sm text-painel-text placeholder:text-painel-text-muted"
          />
          {error && <p className="font-body text-fs-xs text-amarelo-deep">{error}</p>}
          <button
            onClick={addEvent}
            disabled={submitting}
            className="self-start rounded-panel-md bg-azul px-3 py-1.5 font-display text-fs-xs font-semibold text-marrom-escuro disabled:opacity-50"
          >
            {submitting ? "Adicionando..." : "+ Adicionar"}
          </button>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-painel-border pt-3">
          <span className="font-body text-fs-2xs font-bold uppercase tracking-widest text-painel-text-muted">
            Próximos eventos
          </span>
          {upcoming.map((ev) => (
            <div key={ev.id} className="flex items-baseline gap-2">
              <span className="font-body text-fs-2xs text-azul">
                {ev.event_date.split("-").slice(1).reverse().join("/")}
              </span>
              <span className="font-body text-fs-xs text-painel-text">{ev.title}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
