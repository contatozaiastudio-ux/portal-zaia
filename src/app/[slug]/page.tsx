import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  clientTokenMatches,
  currentMonthKey,
  getClientBySlug,
  getMonth,
  getPostsForMonth,
  getProjectObjective,
} from "@/lib/data";
import { Header } from "@/components/Header";
import { ProjectObjectiveBlock } from "@/components/ProjectObjectiveBlock";
import { CategoryCounts } from "@/components/CategoryCounts";
import { ClientPortalTabs } from "@/components/ClientPortalTabs";
import { SetupNotice } from "@/components/SetupNotice";

export default async function ClientHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug } = await params;
  const { t: token } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client || !clientTokenMatches(client, token)) {
    notFound();
  }

  const monthKey = currentMonthKey();
  const [month, objective] = await Promise.all([
    getMonth(client.id, monthKey),
    getProjectObjective(client.id),
  ]);
  const posts = month ? await getPostsForMonth(month.id) : [];

  return (
    <div className="flex min-h-full flex-col">
      <Header clientName={client.name} />
      <ClientPortalTabs slug={slug} token={token} active="home" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <CategoryCounts posts={posts} />

        <ProjectObjectiveBlock text={objective?.text ?? ""} />

        <Link
          href={`/${slug}/feed${token ? `?t=${token}` : ""}`}
          className="self-start rounded-full bg-bordo px-5 py-2.5 font-display text-sm font-semibold text-branco"
        >
          Ver feed de aprovação →
        </Link>
      </main>
    </div>
  );
}
