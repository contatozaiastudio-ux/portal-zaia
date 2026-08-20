export type PostType = "carrossel" | "video" | "estatico";
export type PostStatus = "pendente" | "aprovado" | "ajustar" | "ajuste_feito";
export type TeamMember = "ju" | "carol" | "analista";
export type PlanningStage = "aberto" | "escrita" | "design" | "aprovacao";
export type DemandOrigin = "whatsapp" | "ligacao" | "reuniao" | "email";
export type DemandStatus = "aberta" | "andamento" | "concluida";

export interface Client {
  id: string;
  name: string;
  slug: string;
  access_token: string;
  active: boolean;
  client_stage_id: string;
  client_stage_updated_at: string;
  cover_path: string | null;
}

// Agency-wide pipeline stage — tracks where a client account sits in the
// ~25-day content cycle (Planejamento → ... → Meta batida). Distinct from
// Month.planning_stage, which tracks a single month's copy/design progress.
export interface ClientStage {
  id: string;
  name: string;
  color_bg: string;
  color_text: string;
  position: number;
}

export interface ClientLinks {
  client_id: string;
  notion_url: string | null;
  drive_url: string | null;
  canva_feed_url: string | null;
  canva_stories_url: string | null;
}

export interface ClientContext {
  client_id: string;
  tone: string;
  target_audience: string;
  dont_do: string;
}

export function hasClientContext(context: ClientContext | null): boolean {
  return !!context && !!context.tone && !!context.target_audience && !!context.dont_do;
}

// Long-term vision of the partnership, shown on Home. Distinct from
// Month.strategy_objective ("Foco do mês"), which is tactical and shown at
// the top of the Feed instead.
export interface ProjectObjective {
  client_id: string;
  text: string;
  positioning: string;
}

export interface ScopeItem {
  id: string;
  client_id: string;
  title: string;
  cadence: string;
  content_types: string[];
  notes: string;
  monthly_target: number | null;
  position: number;
}

export interface ScopeProgress {
  id: string;
  month_id: string;
  scope_item_id: string;
  produced_count: number;
}

export interface Demand {
  id: string;
  client_id: string;
  description: string;
  origin: DemandOrigin;
  responsible: TeamMember;
  status: DemandStatus;
  created_at: string;
}

export interface Month {
  id: string;
  client_id: string;
  month_key: string; // "2026-07"
  strategy_objective: string;
  strategy_pillars: string[];
  planning_stage: PlanningStage;
}

export interface PostMediaItem {
  id: string;
  post_id: string;
  storage_path: string;
  position: number;
  url: string;
}

export interface CommentHistoryEntry {
  id: string;
  status: PostStatus;
  comment: string;
  created_at: string;
}

// Carousel copy approved before design work starts — visible to client and
// team, unlike Etapa/Demandas. Reuses PostStatus/CommentHistoryEntry since
// the approve/ajustar flow is identical to Post's.
export interface Script {
  id: string;
  month_id: string;
  position: number;
  title: string;
  content: string;
  status: PostStatus;
  comment_history: CommentHistoryEntry[];
}

export interface Post {
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
  cover_url: string | null;
  media: PostMediaItem[];
  comment_history: CommentHistoryEntry[];
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  carrossel: "Carrossel",
  video: "Vídeo",
  estatico: "Estático",
};

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  ajustar: "Ajustar",
  ajuste_feito: "Ajuste feito",
};

export const TEAM_MEMBER_LABEL: Record<TeamMember, string> = {
  ju: "Ju",
  carol: "Carol",
  analista: "Analista",
};

export const PLANNING_STAGE_LABEL: Record<PlanningStage, string> = {
  aberto: "Aberto",
  escrita: "Escrita",
  design: "Design",
  aprovacao: "Pronto p/ aprovação",
};

export const PLANNING_STAGE_ORDER: PlanningStage[] = ["aberto", "escrita", "design", "aprovacao"];

export const DEMAND_ORIGIN_LABEL: Record<DemandOrigin, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  reuniao: "Reunião",
  email: "E-mail",
};

export const DEMAND_STATUS_LABEL: Record<DemandStatus, string> = {
  aberta: "Aberta",
  andamento: "Em andamento",
  concluida: "Concluída",
};
