import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getClientBySlug, getMonthById, getScript } from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { AdminScriptEditor } from "./AdminScriptEditor";

export default async function AdminScriptPage({
  params,
}: {
  params: Promise<{ slug: string; scriptId: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug, scriptId } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const script = await getScript(scriptId);
  if (!script) notFound();
  const month = await getMonthById(script.month_id);
  if (!month || month.client_id !== client.id) notFound();

  return <AdminScriptEditor slug={slug} script={script} />;
}
