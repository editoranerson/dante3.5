import { Plus, Crown, Diamond } from 'lucide-react';
import type { PlanType } from '@/lib/supabase';
import { getPlanInfo } from '@/lib/plans';

export function SubscriptionBadge({
  plan,
  size = 'sm',
}: {
  plan: PlanType;
  size?: 'sm' | 'md' | 'lg';
}) {
  const info = getPlanInfo(plan);
  if (!info.badgeLabel || !info.badgeIcon) return null;

  const sizes = {
    sm: { badge: 'text-[10px] px-2 py-0.5', icon: 10 },
    md: { badge: 'text-xs px-2.5 py-1', icon: 12 },
    lg: { badge: 'text-sm px-3 py-1.5', icon: 14 },
  };
  const s = sizes[size];

  const Icon = info.badgeIcon === 'plus' ? Plus : info.badgeIcon === 'crown' ? Crown : Diamond;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white ${s.badge}`}
      style={{
        background: 'linear-gradient(135deg, #80D8FF, #FF80AB)',
      }}
    >
      <Icon size={s.icon} strokeWidth={3} />
      {info.badgeLabel}
    </span>
  );
}
