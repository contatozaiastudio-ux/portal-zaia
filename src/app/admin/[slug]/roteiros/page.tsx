import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { currentMonthKey, getClientBySlug, getMonth, getScriptsForMonth } from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { NewScriptForm } from "./NewScriptForm";
import { AdminScriptList } from "./AdminScriptList";

export default async function AdminScriptsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const monthKey = currentMonthKey();
  const month = await getMonth(client.id, monthKey);
  const scripts = month ? await getScriptsForMonth(month.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-panel border-l-[3px] border-azul bg-painel-surface p-5">
        <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-azul">
          Roteiros
        </span>
        <p className="mt-1.5 font-body text-fs-md text-painel-text">
          Texto do carrossel aprovado pelo cliente antes do design começar.
        </p>
      </div>

      <NewScriptForm slug={slug} monthKey={monthKey} />

      <AdminScriptList slug={slug} scripts={scripts} />
    </div>
  );
}
