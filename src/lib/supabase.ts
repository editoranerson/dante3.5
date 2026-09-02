import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://kpplssyiehosifuejobr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGxzc3lpZWhvc2lmdWVqb2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTAwOTUsImV4cCI6MjEwMTM2NjA5NX0.lFhMcypc7raL_LiBMdYsxbKPgK29tso0sDwwg-MOaVc';

export const supabase = createClient(SUPABASE_URL, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const MEDIA_BUCKET = 'media';

export type CardType = 'comum' | 'diversidade' | 'conquista' | 'premium';
export type SubmissionStatus = 'pendente' | 'aprovada' | 'reprovada';
export type UserRole = 'user' | 'admin';
export type PlanType = 'free' | 'dante_plus' | 'dante_premium' | 'dante_premium_plus';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  birthdate: string | null;
  role: UserRole;
  points: number;
  credits: number;
  created_at: string;
  plan: PlanType;
  plan_expires_at: string | null;
  messages_today: number;
  last_message_date: string | null;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HangmanGame {
  id: string;
  secret_word: string;
  hint: string;
  reward_dantes: number;
  is_active: boolean;
  sort_order?: number;
  created_at: string;

}

export interface PuzzleGame {
  id: string;
  image_url: string;
  piece_count: number;
  reward_dantes: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizGroup {
  id: string;
  title: string;
  description: string;
  reward_dantes: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  group_id: string;
  question: string;
  options: string[];
  correct_index: number;
  sort_order: number;
  created_at: string;
}

export type RewardType = 'giftcard' | 'file' | 'card' | 'credits';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  reward_type: RewardType;
  price_dantes: number;
  stock: number;
  file_url: string;
  card_id: string | null;
  credits_amount: number;
  credits_validity_days: number;
  is_active: boolean;
  created_at: string;
}

export type RedemptionStatus = 'pendente' | 'reivindicado' | 'pago';

export interface ShopRedemption {
  id: string;
  user_id: string;
  item_id: string;
  status: RedemptionStatus;
  redeemed_at: string;
  updated_at: string;
  created_at?: string;

}

export interface GameWin {
  id: string;
  user_id: string;
  game_type: string;
  game_id: string;
  reward_dantes: number;
  created_at: string;
}

export interface DanteKnowledge {
  id: string;
  title: string;
  instruction: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sarcasm_score?: number | null;
}

export interface Character {
  id: string;
  name: string;
  photo_url: string;
  presentation: string;
  sort_order: number;
  created_at: string;
}

export interface Secret {
  id: string;
  title: string;
  body: string;
  sort_order: number;
  created_at: string;
}

export interface Song {
  id: string;
  title: string;
  composition: string;
  listener: string;
  youtube_url: string;
  sort_order: number;
  created_at: string;
}

export interface Card {
  id: string;
  name: string;
  number: number;
  description: string;
  type: CardType;
  locked_hint: string;
  points: number;
  photo_url: string;
  sort_order: number;
  created_at: string;
}

export interface CardCode {
  code: string;
  card_id: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  question: string;
  sort_order: number;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  answer: string;
  status: SubmissionStatus;
  reviewer_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SiteContent {
  key: string;
  value: string;
  updated_at: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface ArchivedChapter {
  id: string;
  chapter_number: number;
  title: string;
  slug: string;
  body: string;
  archive_reason: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'nova' | 'lida' | 'respondida';
  created_at: string;
}

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  comum: 'Comum',
  diversidade: 'Diversidade',
  conquista: 'Conquista',
  premium: 'Premium',
};

export const CARD_TYPE_BORDER: Record<CardType, string> = {
  comum: 'bg-card-comum',
  diversidade: 'bg-card-diversidade',
  conquista: 'bg-card-conquista',
  premium: 'bg-card-premium',
};

export interface ChatstoryCharacter {
  id: string;
  name: string;
  avatar_url: string;
  created_at: string;
}

export interface Chatstory {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  synopsis: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface ChatstoryChapter {
  id: string;
  story_id: string;
  title: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export type ChatstoryElementKind = 'message' | 'narration';

export interface ChatstoryElement {
  id: string;
  chapter_id: string;
  kind: ChatstoryElementKind;
  character_id: string | null;
  side: 'left' | 'right' | null;
  content: string;
  sort_order: number;
  created_at: string;
}

// ===== Affiliate Program Types =====

export interface AffiliateAccount {
  user_id: string;
  referral_code: string;
  coins: number;
  is_blocked: boolean;
  block_reason: string | null;
  created_at: string;
}

export interface AffiliateVisit {
  id: string;
  ambassador_id: string;
  visitor_ip: string;
  visitor_session: string;
  retained: boolean;
  visit_date: string;
  created_at: string;
}

export type AffiliateEarningSource =
  | 'visit_batch'
  | 'referral_signup'
  | 'referral_subscription'
  | 'referral_credits'
  | 'referral_dantes'
  | 'redemption'
  | 'admin_adjust';

export interface AffiliateEarning {
  id: string;
  ambassador_id: string;
  amount: number;
  source_type: AffiliateEarningSource;
  source_description: string;
  created_at: string;
}

export type AffiliateRedemptionType = 'dantes_package' | 'pix_withdrawal';
export type AffiliateRedemptionStatus = 'pendente' | 'pago' | 'recusado';

export interface AffiliateRedemption {
  id: string;
  ambassador_id: string;
  redemption_type: AffiliateRedemptionType;
  item_name: string;
  coins_cost: number;
  dantes_amount: number | null;
  pix_key: string | null;
  pix_key_type: string | null;
  status: AffiliateRedemptionStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateShopItem {
  id: string;
  name: string;
  description: string;
  redemption_type: AffiliateRedemptionType;
  coins_cost: number;
  dantes_amount: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type AffiliateNotificationType = 'info' | 'warning' | 'infraction';

export interface AffiliateNotification {
  id: string;
  ambassador_id: string;
  type: AffiliateNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AffiliateReferral {
  id: string;
  ambassador_id: string;
  referred_id: string;
  created_at: string;
}

export interface AffiliateCustomRule {
  id: string;
  ambassador_id: string;
  visit_batch_size: number | null;
  visit_batch_coins: number | null;
  signup_coins: number | null;
  credits_coins_per: number | null;
  credits_threshold: number | null;
  dantes_coins_per: number | null;
  dantes_threshold: number | null;
  plan_coins_override: Record<string, number> | null;
  created_at: string;
}

export interface AffiliateSettings {
  visit_retention_seconds: number;
  visit_batch_size: number;
  visit_batch_coins: number;
  signup_coins: number;
  credits_threshold: number;
  credits_coins_per: number;
  dantes_threshold: number;
  dantes_coins_per: number;
  plan_dante_plus_coins: number;
  plan_dante_premium_coins: number;
  plan_dante_premium_plus_coins: number;
  guidelines: string;
}
