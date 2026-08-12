import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getClientBySlug, getMonthById, getPost } from "@/lib/data";
import { SetupNotice } from "@/components/SetupNotice";
import { AdminPostEditor } from "./AdminPostEditor";

export default async function AdminPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const { slug, postId } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const post = await getPost(postId);
  if (!post) notFound();
  const month = await getMonthById(post.month_id);
  if (!month || month.client_id !== client.id) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AdminPostEditor slug={slug} monthKey={month.month_key} post={post} />
    </div>
  );
}
