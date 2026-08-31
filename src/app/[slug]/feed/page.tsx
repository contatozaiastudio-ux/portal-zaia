import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  clientTokenMatches,
  currentMonthKey,
  getClientBySlug,
  getMonth,
  getPostsForMonth,
  listMonthKeysForClient,
} from "@/lib/data";
import { Header } from "@/components/Header";
import { StrategyBlock } from "@/components/StrategyBlock";
import { CategoryCounts } from "@/components/CategoryCounts";
import { MonthSelector } from "@/components/MonthSelector";
import { ClientPortalTabs } from "@/components/ClientPortalTabs";
import { PostCardContent } from "@/components/PostCard";
import { SetupNotice } from "@/components/SetupNotice";

export default async function ClientFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string; m?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug } = await params;
  const { t: token, m: monthParam } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client || !clientTokenMatches(client, token)) {
    notFound();
  }

  const monthKey = monthParam ?? currentMonthKey();
  const [month, months] = await Promise.all([
    getMonth(client.id, monthKey),
    listMonthKeysForClient(client.id),
  ]);
  const posts = month ? await getPostsForMonth(month.id) : [];

  return (
    <div className="flex min-h-full flex-col">
      <Header clientName={client.name} />
      <ClientPortalTabs slug={slug} token={token} active="feed" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CategoryCounts posts={posts} />
          <MonthSelector
            months={months}
            current={monthKey}
            basePath={`/${slug}/feed`}
            query={token ? { t: token } : undefined}
          />
        </div>

        <StrategyBlock
          objective={month?.strategy_objective ?? ""}
          pillars={month?.strategy_pillars ?? []}
        />

        {posts.length === 0 ? (
          <p className="font-body text-sm text-ink/60">
            Nenhum post cadastrado para este mês ainda.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${slug}/post/${post.id}?${new URLSearchParams({
                  ...(token ? { t: token } : {}),
                  m: monthKey,
                }).toString()}`}
              >
                <PostCardContent post={post} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
