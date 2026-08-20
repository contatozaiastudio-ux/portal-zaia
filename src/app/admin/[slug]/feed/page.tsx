import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  currentMonthKey,
  getClientBySlug,
  getMonth,
  getPendingPostsForClient,
  getPostsForMonth,
  listMonthKeysForClient,
  listUnlinkedApprovedScripts,
  upcomingMonthKeys,
} from "@/lib/data";
import { CategoryCounts } from "@/components/CategoryCounts";
import { MonthSelector } from "@/components/MonthSelector";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { MiniCalendar } from "@/components/MiniCalendar";
import { SetupNotice } from "@/components/SetupNotice";
import { StrategyEditor } from "../StrategyEditor";
import { NewPostForm } from "../NewPostForm";
import { AdminFeedGrid } from "../AdminFeedGrid";
import { PendingPanel } from "../PendingPanel";

export default async function ClientFeedPage({
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
  const [month, savedMonths, pendingPosts] = await Promise.all([
    getMonth(client.id, monthKey),
    listMonthKeysForClient(client.id),
    getPendingPostsForClient(client.id),
  ]);
  // Merge in upcoming months that don't have a row yet, so the team can
  // plan ahead instead of being stuck adding everything to whatever month
  // happens to be open already (see ensureMonth in the posts route).
  const months = Array.from(new Set([...savedMonths, ...upcomingMonthKeys()])).sort();
  const posts = month ? await getPostsForMonth(month.id) : [];
  const unlinkedScripts = month ? await listUnlinkedApprovedScripts(month.id) : [];

  return (
    // Fundo sólido só nesta tela — a foto do painel briga visualmente com
    // as artes/mídias sendo avaliadas aqui. Usa o tom escuro geral do painel
    // (--painel-bg), não --bordo, pra combinar com o resto da interface.
    // painel-bleed estica isso até a borda da viewport em fluxo normal (sem
    // fixed/absolute), então nunca fica por cima do header/abas acima.
    <div className="painel-bleed bg-painel-bg -my-8 px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CategoryCounts posts={posts} dark />
            <div className="flex flex-wrap items-center gap-3">
              <CopyLinkButton path={`/${slug}/feed?t=${client.access_token}`} dark />
              <MonthSelector months={months} current={monthKey} basePath={`/admin/${slug}/feed`} dark />
            </div>
          </div>

          <StrategyEditor
            slug={slug}
            monthKey={monthKey}
            initialObjective={month?.strategy_objective ?? ""}
            initialPillars={month?.strategy_pillars ?? []}
          />

          <NewPostForm slug={slug} monthKey={monthKey} scripts={unlinkedScripts} />

          <AdminFeedGrid slug={slug} monthKey={monthKey} posts={posts} />
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-80">
          <MiniCalendar
            monthKey={monthKey}
            scheduledDates={posts.flatMap((p) => (p.scheduled_date ? [p.scheduled_date] : []))}
          />
          <PendingPanel slug={slug} posts={pendingPosts} />
        </div>
      </div>
    </div>
  );
}
