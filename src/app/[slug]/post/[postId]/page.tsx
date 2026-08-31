import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { clientTokenMatches, getClientBySlug, getMonthById, getPost } from "@/lib/data";
import { Header } from "@/components/Header";
import { SetupNotice } from "@/components/SetupNotice";
import { PostDetailClient } from "./PostDetailClient";

export default async function ClientPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; postId: string }>;
  searchParams: Promise<{ t?: string; m?: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug, postId } = await params;
  const { t: token } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client || !clientTokenMatches(client, token)) {
    notFound();
  }

  const post = await getPost(postId);
  if (!post) notFound();
  const month = await getMonthById(post.month_id);
  if (!month || month.client_id !== client.id) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <Header clientName={client.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <PostDetailClient
          post={post}
          slug={slug}
          token={token ?? ""}
          editable
          backHref={`/${slug}/feed?${new URLSearchParams({
            ...(token ? { t: token } : {}),
            m: month.month_key,
          }).toString()}`}
        />
      </main>
    </div>
  );
}
