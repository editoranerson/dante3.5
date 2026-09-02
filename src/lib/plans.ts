import type { PlanType } from '@/lib/supabase';

export interface PlanInfo {
  id: PlanType;
  name: string;
  price: number;
  priceLabel: string;
  dailyLimit: number;
  badgeLabel: string | null;
  badgeIcon: 'plus' | 'crown' | 'diamond' | null;
  highlight?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Gratuito',
    dailyLimit: 10,
    badgeLabel: null,
    badgeIcon: null,
  },
  {
    id: 'dante_plus',
    name: 'Dante Plus',
    price: 4.9,
    priceLabel: 'R$ 4,90/mês',
    dailyLimit: 20,
    badgeLabel: 'Plus',
    badgeIcon: 'plus',
  },
  {
    id: 'dante_premium',
    name: 'Dante Premium',
    price: 9.9,
    priceLabel: 'R$ 9,90/mês',
    dailyLimit: 40,
    badgeLabel: 'Premium',
    badgeIcon: 'crown',
    highlight: true,
  },
  {
    id: 'dante_premium_plus',
    name: 'Dante Premium+',
    price: 19.9,
    priceLabel: 'R$ 19,90/mês',
    dailyLimit: 100,
    badgeLabel: 'Premium+',
    badgeIcon: 'diamond',
  },
];

export const PLAN_MAP: Record<PlanType, PlanInfo> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<PlanType, PlanInfo>,
);

export function getPlanInfo(plan: PlanType): PlanInfo {
  return PLAN_MAP[plan] ?? PLANS[0];
}

export function getDailyLimit(plan: PlanType): number {
  return getPlanInfo(plan).dailyLimit;
}

export function isSubscriptionActive(profile: {
  plan: PlanType;
  plan_expires_at: string | null;
}): boolean {
  if (profile.plan === 'free') return false;
  if (!profile.plan_expires_at) return false;
  return new Date(profile.plan_expires_at) > new Date();
}

export function getEffectivePlan(profile: {
  plan: PlanType;
  plan_expires_at: string | null;
}): PlanType {
  if (!isSubscriptionActive(profile)) return 'free';
  return profile.plan;
}
