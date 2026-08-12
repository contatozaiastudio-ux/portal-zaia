import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getClientBySlug, listDemandsForClient } from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { DemandsPanel } from "./DemandsPanel";

export default async function ClientDemandsPage({
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

  const demands = await listDemandsForClient(client.id);

  return <DemandsPanel slug={slug} demands={demands} />;
}
