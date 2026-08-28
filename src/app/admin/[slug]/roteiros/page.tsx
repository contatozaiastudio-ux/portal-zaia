import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  currentMonthKey,
  getClientBySlug,
  getMonth,
  getScriptsForMonth,
  listMonthKeysForClient,
  upcomingMonthKeys,
} from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { MonthSelector } from "@/components/MonthSelector";
import { NewScriptForm } from "./NewScriptForm";
import { AdminScriptList } from "./AdminScriptList";

export default async function AdminScriptsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug } = await params;
  const { m: monthParam } = await searchParams;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const monthKey = monthParam ?? currentMonthKey();
  const [month, savedMonths] = await Promise.all([
    getMonth(client.id, monthKey),
    listMonthKeysForClient(client.id),
  ]);
  // Merge in upcoming months that don't have a row yet, so the team can
  // select "Setembro" ahead of time instead of being stuck adding it to
  // whatever month is currently open (see ensureMonth in the scripts route).
  const months = Array.from(new Set([...savedMonths, ...upcomingMonthKeys()])).sort();
  const scripts = month ? await getScriptsForMonth(month.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border-l-[3px] border-azul bg-painel-surface p-5">
        <div>
          <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-azul">
            Roteiros
          </span>
          <p className="mt-1.5 font-body text-fs-md text-painel-text">
            Texto do carrossel aprovado pelo cliente antes do design começar.
          </p>
        </div>
        <MonthSelector months={months} current={monthKey} basePath={`/admin/${slug}/roteiros`} />
      </div>

      <NewScriptForm slug={slug} monthKey={monthKey} />

      <AdminScriptList key={monthKey} slug={slug} scripts={scripts} />
    </div>
  );
}
