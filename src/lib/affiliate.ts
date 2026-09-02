import { supabase, type AffiliateSettings } from '@/lib/supabase';

export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const keys = [
    'affiliate_visit_retention_seconds',
    'affiliate_visit_batch_size',
    'affiliate_visit_batch_coins',
    'affiliate_signup_coins',
    'affiliate_credits_threshold',
    'affiliate_credits_coins_per',
    'affiliate_dantes_threshold',
    'affiliate_dantes_coins_per',
    'affiliate_plan_dante_plus_coins',
    'affiliate_plan_dante_premium_coins',
    'affiliate_plan_dante_premium_plus_coins',
    'affiliate_guidelines',
  ];

  const { data } = await supabase.from('site_content').select('key, value').in('key', keys);
  const map: Record<string, string> = {};
  (data ?? []).forEach((row: { key: string; value: string }) => {
    map[row.key] = row.value;
  });

  return {
    visit_retention_seconds: parseInt(map['affiliate_visit_retention_seconds'] || '30', 10),
    visit_batch_size: parseInt(map['affiliate_visit_batch_size'] || '10', 10),
    visit_batch_coins: parseInt(map['affiliate_visit_batch_coins'] || '5', 10),
    signup_coins: parseInt(map['affiliate_signup_coins'] || '20', 10),
    credits_threshold: parseInt(map['affiliate_credits_threshold'] || '10', 10),
    credits_coins_per: parseInt(map['affiliate_credits_coins_per'] || '2', 10),
    dantes_threshold: parseInt(map['affiliate_dantes_threshold'] || '50', 10),
    dantes_coins_per: parseInt(map['affiliate_dantes_coins_per'] || '1', 10),
    plan_dante_plus_coins: parseInt(map['affiliate_plan_dante_plus_coins'] || '30', 10),
    plan_dante_premium_coins: parseInt(map['affiliate_plan_dante_premium_coins'] || '60', 10),
    plan_dante_premium_plus_coins: parseInt(map['affiliate_plan_dante_premium_plus_coins'] || '120', 10),
    guidelines: map['affiliate_guidelines'] || '',
  };
}

export function getReferralLink(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://queridodante.site';
  return `${origin}/?ref=${code}`;
}

export function getRefCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}
