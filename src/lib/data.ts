import "server-only";
import { getSupabase } from "./supabase";
import type {
  Client,
  ClientContext,
  ClientLinks,
  ClientStage,
  CommentHistoryEntry,
  Demand,
  DemandOrigin,
  DemandStatus,
  Month,
  PlanningStage,
  Post,
  PostMediaItem,
  PostStatus,
  PostType,
  ProjectObjective,
  Script,
  ScopeItem,
  ScopeProgress,
  TeamMember,
} from "./types";
import { hasClientContext } from "./types";

const MEDIA_BUCKET = "media";

function mediaPublicUrl(storagePath: string): string {
  const { data } = getSupabase().storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

interface PostMediaRow {
  id: string;
  post_id: string;
  storage_path: string;
  position: number;
}

interface CommentHistoryRow {
  id: string;
  status: PostStatus;
  comment: string;
  created_at: string;
}

interface PostRow {
  id: string;
  month_id: string;
  script_id: string | null;
  position: number;
  type: PostType;
  caption: string;
  scheduled_date: string | null;
  status: PostStatus;
  comment: string;
  media_link: string | null;
  cover_path: string | null;
  post_media?: PostMediaRow[];
  post_comment_history?: CommentHistoryRow[];
}

function mapPost(row: PostRow): Post {
  const media: PostMediaItem[] = (row.post_media ?? [])
    .map((m) => ({
      id: m.id,
      post_id: m.post_id,
      storage_path: m.storage_path,
      position: m.position,
      url: mediaPublicUrl(m.storage_path),
    }))
    .sort((a: PostMediaItem, b: PostMediaItem) => a.position - b.position);

  const comment_history: CommentHistoryEntry[] = (row.post_comment_history ?? [])
    .map((h) => ({
      id: h.id,
      status: h.status,
      comment: h.comment,
      created_at: h.created_at,
    }))
    .sort(
      (a: CommentHistoryEntry, b: CommentHistoryEntry) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return {
    id: row.id,
    month_id: row.month_id,
    script_id: row.script_id,
    position: row.position,
    type: row.type,
    caption: row.caption,
    scheduled_date: row.scheduled_date,
    status: row.status,
    comment: row.comment,
    media_link: row.media_link,
    cover_url: row.cover_path ? mediaPublicUrl(row.cover_path) : null,
    media,
    comment_history,
  };
}

const POST_SELECT = "*, post_media(*), post_comment_history(*)";

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const { data, error } = await getSupabase()
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClients(opts?: { includeInactive?: boolean }): Promise<Client[]> {
  let query = getSupabase().from("clients").select("*").order("name");
  if (!opts?.includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function setClientActive(clientId: string, active: boolean): Promise<void> {
  const { error } = await getSupabase().from("clients").update({ active }).eq("id", clientId);
  if (error) throw error;
}

export async function listClientStages(): Promise<ClientStage[]> {
  const { data, error } = await getSupabase()
    .from("client_stages")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateClientStage(clientId: string, stageId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("clients")
    .update({ client_stage_id: stageId, client_stage_updated_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw error;
}

export async function getClientLinks(clientId: string): Promise<ClientLinks | null> {
  const { data, error } = await getSupabase()
    .from("client_links")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertClientLinks(
  clientId: string,
  input: Partial<Omit<ClientLinks, "client_id">>
): Promise<void> {
  const { error } = await getSupabase()
    .from("client_links")
    .upsert({ client_id: clientId, ...input }, { onConflict: "client_id" });
  if (error) throw error;
}

export interface CycleInfo {
  daysLeft: number;
  totalDays: number;
  elapsedDays: number;
  deadlineLabel: string;
}

// The agency's content cycle always closes on day 25 — runs from the day
// after the previous closing through day 25 of the current (or next, if
// we're past the 25th) month. Computed live, nothing stored in the DB.
export function getCycleInfo(now: Date = new Date()): CycleInfo {
  let cycleEnd = new Date(now.getFullYear(), now.getMonth(), 25);
  if (now.getDate() > 25) cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 25);
  const prevClosing = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth() - 1, 25);
  const cycleStart = new Date(
    prevClosing.getFullYear(),
    prevClosing.getMonth(),
    prevClosing.getDate() + 1
  );

  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / dayMs) + 1;
  const daysLeft = Math.ceil((cycleEnd.getTime() - now.getTime()) / dayMs);
  const elapsedDays = totalDays - daysLeft;
  const deadlineLabel = cycleEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return { daysLeft, totalDays, elapsedDays, deadlineLabel };
}

export interface AgencyClientSummary {
  client: Client;
  hasContext: boolean;
  stage: PlanningStage;
  pendingCount: number;
  adjustCount: number;
  openDemandCount: number;
}

// Everything the agency-level dashboard (/admin) needs per client: current
// month's stage and post counts, open demands, and whether ClientContext is
// filled in yet. N+1 queries, but the client list is small (a handful of
// agency clients), so this stays simple over premature optimization.
export async function getAgencyOverview(includeInactive = false): Promise<AgencyClientSummary[]> {
  const clients = await listClients({ includeInactive });
  const monthKey = currentMonthKey();
  const supabase = getSupabase();

  return Promise.all(
    clients.map(async (client) => {
      const [context, month, demands] = await Promise.all([
        getClientContext(client.id),
        getMonth(client.id, monthKey),
        listDemandsForClient(client.id),
      ]);

      let pendingCount = 0;
      let adjustCount = 0;
      if (month) {
        const { data } = await supabase.from("posts").select("status").eq("month_id", month.id);
        (data ?? []).forEach((p: { status: PostStatus }) => {
          if (p.status === "ajustar") adjustCount++;
          if (p.status === "pendente") pendingCount++;
        });
      }

      return {
        client,
        hasContext: hasClientContext(context),
        stage: month?.planning_stage ?? "aberto",
        pendingCount,
        adjustCount,
        openDemandCount: demands.filter((d) => d.status !== "concluida").length,
      };
    })
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Creates Client + ClientContext together, per the mandatory checklist (see
// briefing section 4.1): a client can never exist without its context. If
// the context insert fails, the just-created client is rolled back so no
// orphan client is left behind.
export async function createClientWithContext(input: {
  name: string;
  tone: string;
  target_audience: string;
  dont_do: string;
}): Promise<Client> {
  const supabase = getSupabase();
  const baseSlug = slugify(input.name);

  let slug = baseSlug;
  let suffix = 1;
  // Slugs must be unique; retry with a numeric suffix on collision.
  while (true) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const { data: firstStage, error: stageError } = await supabase
    .from("client_stages")
    .select("id")
    .eq("position", 1)
    .single();
  if (stageError) throw stageError;

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({ name: input.name, slug, client_stage_id: firstStage.id })
    .select("*")
    .single();
  if (clientError) throw clientError;

  const { error: contextError } = await supabase.from("client_context").insert({
    client_id: client.id,
    tone: input.tone,
    target_audience: input.target_audience,
    dont_do: input.dont_do,
  });
  if (contextError) {
    await supabase.from("clients").delete().eq("id", client.id);
    throw contextError;
  }

  return client;
}

export async function getClientContext(clientId: string): Promise<ClientContext | null> {
  const { data, error } = await getSupabase()
    .from("client_context")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertClientContext(
  clientId: string,
  input: { tone: string; target_audience: string; dont_do: string }
): Promise<void> {
  const { error } = await getSupabase()
    .from("client_context")
    .upsert({ client_id: clientId, ...input, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getProjectObjective(clientId: string): Promise<ProjectObjective | null> {
  const { data, error } = await getSupabase()
    .from("project_objectives")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProjectObjective(clientId: string, text: string): Promise<void> {
  const { error } = await getSupabase()
    .from("project_objectives")
    .upsert({ client_id: clientId, text, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function upsertBrandPositioning(clientId: string, positioning: string): Promise<void> {
  const { error } = await getSupabase()
    .from("project_objectives")
    .upsert({ client_id: clientId, positioning, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function listScopeItems(clientId: string): Promise<ScopeItem[]> {
  const { data, error } = await getSupabase()
    .from("scope_items")
    .select("*")
    .eq("client_id", clientId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getScopeItem(scopeItemId: string): Promise<ScopeItem | null> {
  const { data, error } = await getSupabase()
    .from("scope_items")
    .select("*")
    .eq("id", scopeItemId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createScopeItem(input: {
  client_id: string;
  title: string;
  cadence: string;
  content_types: string[];
  notes: string;
  monthly_target: number | null;
}): Promise<ScopeItem> {
  const { data: existing } = await getSupabase()
    .from("scope_items")
    .select("position")
    .eq("client_id", input.client_id)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await getSupabase()
    .from("scope_items")
    .insert({ ...input, position: nextPosition })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateScopeItem(
  scopeItemId: string,
  input: Partial<{
    title: string;
    cadence: string;
    content_types: string[];
    notes: string;
    monthly_target: number | null;
  }>
): Promise<void> {
  const { error } = await getSupabase().from("scope_items").update(input).eq("id", scopeItemId);
  if (error) throw error;
}

export async function deleteScopeItem(scopeItemId: string): Promise<void> {
  const { error } = await getSupabase().from("scope_items").delete().eq("id", scopeItemId);
  if (error) throw error;
}

// Keyed by scope_item_id for quick lookup when rendering the Checklist de
// Produção alongside listScopeItems().
export async function getScopeProgressForMonth(
  monthId: string
): Promise<Record<string, ScopeProgress>> {
  const { data, error } = await getSupabase()
    .from("scope_progress")
    .select("*")
    .eq("month_id", monthId);
  if (error) throw error;
  const byScopeItem: Record<string, ScopeProgress> = {};
  (data ?? []).forEach((row: ScopeProgress) => {
    byScopeItem[row.scope_item_id] = row;
  });
  return byScopeItem;
}

export async function upsertScopeProgress(
  monthId: string,
  scopeItemId: string,
  producedCount: number
): Promise<void> {
  const { error } = await getSupabase()
    .from("scope_progress")
    .upsert(
      { month_id: monthId, scope_item_id: scopeItemId, produced_count: producedCount },
      { onConflict: "month_id,scope_item_id" }
    );
  if (error) throw error;
}

export function clientTokenMatches(client: Client, token: string | undefined): boolean {
  return Boolean(token) && client.access_token === token;
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Months only exist in the DB once something is created in them (see
// ensureMonth), so a selector built purely from listMonthKeysForClient can
// never offer a future month to plan ahead in — there'd be nothing to click.
// This generates the current month key plus `count` months forward so the
// team can pick "Setembro" before anything has been saved there yet.
export function upcomingMonthKeys(count = 6): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 0; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function listMonthKeysForClient(clientId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("months")
    .select("month_key")
    .eq("client_id", clientId)
    .order("month_key", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.month_key);
}

export async function getMonth(clientId: string, monthKey: string): Promise<Month | null> {
  const { data, error } = await getSupabase()
    .from("months")
    .select("*")
    .eq("client_id", clientId)
    .eq("month_key", monthKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMonthById(monthId: string): Promise<Month | null> {
  const { data, error } = await getSupabase()
    .from("months")
    .select("*")
    .eq("id", monthId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureMonth(clientId: string, monthKey: string): Promise<Month> {
  const existing = await getMonth(clientId, monthKey);
  if (existing) return existing;
  const { data, error } = await getSupabase()
    .from("months")
    .insert({ client_id: clientId, month_key: monthKey })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMonthStrategy(
  monthId: string,
  strategy_objective: string,
  strategy_pillars: string[]
): Promise<void> {
  const { error } = await getSupabase()
    .from("months")
    .update({ strategy_objective, strategy_pillars: strategy_pillars.slice(0, 3) })
    .eq("id", monthId);
  if (error) throw error;
}

export async function updateMonthStage(monthId: string, planning_stage: PlanningStage): Promise<void> {
  const { error } = await getSupabase()
    .from("months")
    .update({ planning_stage })
    .eq("id", monthId);
  if (error) throw error;
}

export async function listDemandsForClient(clientId: string): Promise<Demand[]> {
  const { data, error } = await getSupabase()
    .from("demands")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// All open demands (status != concluida) across active clients, for the
// agency-level consolidated view. Joins in the client name for display.
export async function listOpenDemandsAllClients(): Promise<
  Array<Demand & { client_name: string }>
> {
  const { data, error } = await getSupabase()
    .from("demands")
    .select("*, clients!inner(name, active)")
    .eq("clients.active", true)
    .neq("status", "concluida")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { clients, ...demand } = row as Demand & { clients: { name: string } };
    return { ...demand, client_name: clients.name };
  });
}

export async function createDemand(input: {
  client_id: string;
  description: string;
  origin: DemandOrigin;
  responsible: TeamMember;
}): Promise<Demand> {
  const { data, error } = await getSupabase()
    .from("demands")
    .insert({ ...input, status: "aberta" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateDemandStatus(
  demandId: string,
  status: DemandStatus,
  clientId: string
): Promise<void> {
  const { error } = await getSupabase()
    .from("demands")
    .update({ status })
    .eq("id", demandId)
    .eq("client_id", clientId);
  if (error) throw error;
}

export async function getPostsForMonth(monthId: string): Promise<Post[]> {
  const { data, error } = await getSupabase()
    .from("posts")
    .select(POST_SELECT)
    .eq("month_id", monthId)
    .order("scheduled_date", { ascending: false, nullsFirst: false })
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await getSupabase()
    .from("posts")
    .select(POST_SELECT)
    .eq("id", postId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : null;
}

export async function createPost(
  monthId: string,
  input: {
    type: PostType;
    caption: string;
    scheduled_date: string | null;
    script_id?: string | null;
  }
): Promise<Post> {
  const { data: existing } = await getSupabase()
    .from("posts")
    .select("position")
    .eq("month_id", monthId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await getSupabase()
    .from("posts")
    .insert({
      month_id: monthId,
      position: nextPosition,
      type: input.type,
      caption: input.caption,
      scheduled_date: input.scheduled_date,
      script_id: input.script_id ?? null,
    })
    .select(POST_SELECT)
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function updatePost(
  postId: string,
  input: Partial<{
    type: PostType;
    caption: string;
    scheduled_date: string | null;
    media_link: string | null;
  }>
): Promise<void> {
  const { error } = await getSupabase()
    .from("posts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) throw error;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await getSupabase().from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function reorderPosts(orderedPostIds: string[]): Promise<void> {
  const supabase = getSupabase();
  await Promise.all(
    orderedPostIds.map((id, index) =>
      supabase.from("posts").update({ position: index }).eq("id", id)
    )
  );
}

export async function setPostStatus(
  postId: string,
  status: PostStatus,
  comment: string
): Promise<void> {
  const supabase = getSupabase();
  const { error: updateError } = await supabase
    .from("posts")
    .update({ status, comment, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (updateError) throw updateError;

  const { error: historyError } = await supabase
    .from("post_comment_history")
    .insert({ post_id: postId, status, comment });
  if (historyError) throw historyError;
}

export async function getPendingPostsForClient(
  clientId: string
): Promise<Array<Post & { month_key: string }>> {
  const { data, error } = await getSupabase()
    .from("posts")
    .select(`${POST_SELECT}, months!inner(client_id, month_key)`)
    .eq("months.client_id", clientId)
    .eq("status", "ajustar")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { months, ...postRow } = row as PostRow & { months: { month_key: string } };
    return { ...mapPost(postRow), month_key: months.month_key };
  });
}

interface ScriptRow {
  id: string;
  month_id: string;
  position: number;
  title: string;
  content: string;
  status: PostStatus;
  script_comment_history?: CommentHistoryRow[];
}

const SCRIPT_SELECT = "*, script_comment_history(*)";

function mapScript(row: ScriptRow): Script {
  const comment_history: CommentHistoryEntry[] = (row.script_comment_history ?? [])
    .map((h) => ({ id: h.id, status: h.status, comment: h.comment, created_at: h.created_at }))
    .sort(
      (a: CommentHistoryEntry, b: CommentHistoryEntry) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return {
    id: row.id,
    month_id: row.month_id,
    position: row.position,
    title: row.title,
    content: row.content,
    status: row.status,
    comment_history,
  };
}

export async function getScriptsForMonth(monthId: string): Promise<Script[]> {
  const { data, error } = await getSupabase()
    .from("scripts")
    .select(SCRIPT_SELECT)
    .eq("month_id", monthId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapScript);
}

export async function getScript(scriptId: string): Promise<Script | null> {
  const { data, error } = await getSupabase()
    .from("scripts")
    .select(SCRIPT_SELECT)
    .eq("id", scriptId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapScript(data) : null;
}

// Scripts already approved this month but not yet linked to a Post — feeds
// the optional "Vincular a um roteiro aprovado" picker in NewPostForm.
export async function listUnlinkedApprovedScripts(monthId: string): Promise<Script[]> {
  const supabase = getSupabase();
  const [{ data: scripts, error: scriptsError }, { data: posts, error: postsError }] =
    await Promise.all([
      supabase
        .from("scripts")
        .select(SCRIPT_SELECT)
        .eq("month_id", monthId)
        .eq("status", "aprovado"),
      supabase.from("posts").select("script_id").eq("month_id", monthId).not("script_id", "is", null),
    ]);
  if (scriptsError) throw scriptsError;
  if (postsError) throw postsError;
  const linkedIds = new Set((posts ?? []).map((p: { script_id: string }) => p.script_id));
  return (scripts ?? []).filter((s: ScriptRow) => !linkedIds.has(s.id)).map(mapScript);
}

export async function createScript(
  monthId: string,
  input: { title: string; content: string }
): Promise<Script> {
  const { data: existing } = await getSupabase()
    .from("scripts")
    .select("position")
    .eq("month_id", monthId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await getSupabase()
    .from("scripts")
    .insert({ month_id: monthId, position: nextPosition, ...input })
    .select(SCRIPT_SELECT)
    .single();
  if (error) throw error;
  return mapScript(data);
}

export async function updateScript(
  scriptId: string,
  input: Partial<{ title: string; content: string }>
): Promise<void> {
  const { error } = await getSupabase()
    .from("scripts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", scriptId);
  if (error) throw error;
}

export async function deleteScript(scriptId: string): Promise<void> {
  const { error } = await getSupabase().from("scripts").delete().eq("id", scriptId);
  if (error) throw error;
}

export async function reorderScripts(orderedScriptIds: string[]): Promise<void> {
  const supabase = getSupabase();
  await Promise.all(
    orderedScriptIds.map((id, index) =>
      supabase.from("scripts").update({ position: index }).eq("id", id)
    )
  );
}

export async function setScriptStatus(
  scriptId: string,
  status: PostStatus,
  comment: string
): Promise<void> {
  const supabase = getSupabase();
  const { error: updateError } = await supabase
    .from("scripts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", scriptId);
  if (updateError) throw updateError;

  const { error: historyError } = await supabase
    .from("script_comment_history")
    .insert({ script_id: scriptId, status, comment });
  if (historyError) throw historyError;
}

export async function addMediaToPost(
  postId: string,
  storagePath: string,
  position: number
): Promise<PostMediaItem> {
  const { data, error } = await getSupabase()
    .from("post_media")
    .insert({ post_id: postId, storage_path: storagePath, position })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    post_id: data.post_id,
    storage_path: data.storage_path,
    position: data.position,
    url: mediaPublicUrl(data.storage_path),
  };
}

export async function getMediaPostId(mediaId: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("post_media")
    .select("post_id")
    .eq("id", mediaId)
    .maybeSingle();
  if (error) throw error;
  return data?.post_id ?? null;
}

export async function removeMedia(mediaId: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from("post_media")
    .select("storage_path")
    .eq("id", mediaId)
    .single();
  if (error) throw error;
  await getSupabase().storage.from(MEDIA_BUCKET).remove([data.storage_path]);
  const { error: delError } = await getSupabase().from("post_media").delete().eq("id", mediaId);
  if (delError) throw delError;
}

export async function reorderMedia(orderedMediaIds: string[]): Promise<void> {
  const supabase = getSupabase();
  await Promise.all(
    orderedMediaIds.map((id, index) =>
      supabase.from("post_media").update({ position: index }).eq("id", id)
    )
  );
}

// Pre-authorizes a single upload path so the browser can PUT the file bytes
// straight to Supabase Storage (see AdminPostEditor), instead of routing
// large videos through the Vercel serverless function's request body limit.
export async function setPostCover(postId: string, storagePath: string): Promise<void> {
  const { data: existing, error: fetchError } = await getSupabase()
    .from("posts")
    .select("cover_path")
    .eq("id", postId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await getSupabase()
    .from("posts")
    .update({ cover_path: storagePath })
    .eq("id", postId);
  if (error) throw error;

  if (existing?.cover_path) {
    await getSupabase().storage.from(MEDIA_BUCKET).remove([existing.cover_path]);
  }
}

export async function clearPostCover(postId: string): Promise<void> {
  const { data: existing, error: fetchError } = await getSupabase()
    .from("posts")
    .select("cover_path")
    .eq("id", postId)
    .single();
  if (fetchError) throw fetchError;
  if (!existing?.cover_path) return;

  await getSupabase().storage.from(MEDIA_BUCKET).remove([existing.cover_path]);
  const { error } = await getSupabase()
    .from("posts")
    .update({ cover_path: null })
    .eq("id", postId);
  if (error) throw error;
}

export async function createSignedMediaUpload(
  clientSlug: string,
  monthKey: string,
  postId: string,
  fileName: string
): Promise<{ path: string; token: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${clientSlug}/${monthKey}/${postId}/${Date.now()}-${safeName}`;
  const { data, error } = await getSupabase()
    .storage.from(MEDIA_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { path, token: data.token };
}
