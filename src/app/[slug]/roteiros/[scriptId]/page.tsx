import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { clientTokenMatches, getClientBySlug, getMonthById, getScript } from "@/lib/data";
import { Header } from "@/components/Header";
import { SetupNotice } from "@/components/SetupNotice";
import { ScriptDetailClient } from "./ScriptDetailClient";

export default async function ClientScriptPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; scriptId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug, scriptId } = await params;
  const { t: token } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client || !clientTokenMatches(client, token)) {
    notFound();
  }

  const script = await getScript(scriptId);
  if (!script) notFound();
  const month = await getMonthById(script.month_id);
  if (!month || month.client_id !== client.id) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <Header clientName={client.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <ScriptDetailClient
          script={script}
          slug={slug}
          token={token ?? ""}
          editable
          backHref={`/${slug}/roteiros${token ? `?t=${token}` : ""}`}
        />
      </main>
    </div>
  );
}
