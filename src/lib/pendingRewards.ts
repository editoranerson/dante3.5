import { supabase } from '@/lib/supabase';

const PENDING_CARDS_KEY = 'pendingCards';
const PENDING_DANTES_KEY = 'pendingDantes';
const PENDING_GAMES_KEY = 'pendingGames';

export interface PendingCard {
  code: string;
  redeemedAt: string;
}

export interface PendingGame {
  gameType: string;
  gameId: string;
  reward: number;
  redeemedAt: string;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getPendingCards(): PendingCard[] {
  if (typeof window === 'undefined') return [];
  return safeParse<PendingCard[]>(localStorage.getItem(PENDING_CARDS_KEY), []);
}

export function addPendingCard(code: string): PendingCard[] {
  if (typeof window === 'undefined') return [];
  const existing = getPendingCards();
  if (existing.some((c) => c.code.toUpperCase() === code.toUpperCase())) return existing;
  const updated = [...existing, { code: code.toUpperCase(), redeemedAt: new Date().toISOString() }];
  localStorage.setItem(PENDING_CARDS_KEY, JSON.stringify(updated));
  return updated;
}

export function clearPendingCards(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_CARDS_KEY);
}

export function getPendingDantes(): number {
  if (typeof window === 'undefined') return 0;
  return safeParse<number>(localStorage.getItem(PENDING_DANTES_KEY), 0);
}

export function addPendingDantes(amount: number): number {
  if (typeof window === 'undefined' || amount <= 0) return getPendingDantes();
  const updated = getPendingDantes() + amount;
  localStorage.setItem(PENDING_DANTES_KEY, JSON.stringify(updated));
  return updated;
}

export function clearPendingDantes(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_DANTES_KEY);
}

export function getPendingGames(): PendingGame[] {
  if (typeof window === 'undefined') return [];
  return safeParse<PendingGame[]>(localStorage.getItem(PENDING_GAMES_KEY), []);
}

export function addPendingGame(gameType: string, gameId: string, reward: number): PendingGame[] {
  if (typeof window === 'undefined') return [];
  const existing = getPendingGames();
  if (existing.some((g) => g.gameType === gameType && g.gameId === gameId)) return existing;
  const updated = [
    ...existing,
    { gameType, gameId, reward, redeemedAt: new Date().toISOString() },
  ];
  localStorage.setItem(PENDING_GAMES_KEY, JSON.stringify(updated));
  return updated;
}

export function clearPendingGames(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_GAMES_KEY);
}

export function hasPendingRewards(): boolean {
  return getPendingCards().length > 0 || getPendingDantes() > 0 || getPendingGames().length > 0;
}

export interface SyncResult {
  cardsSynced: number;
  gamesSynced: number;
  dantesAwarded: number;
  errors: string[];
}

export async function syncPendingRewards(): Promise<SyncResult> {
  const result: SyncResult = { cardsSynced: 0, gamesSynced: 0, dantesAwarded: 0, errors: [] };

  const pendingCards = getPendingCards();
  for (const pc of pendingCards) {
    try {
      const { data, error } = await supabase.rpc('redeem_card_code', { p_code: pc.code });
      if (error) {
        result.errors.push(`Carta ${pc.code}: ${error.message}`);
        continue;
      }
      const res = data as { ok?: boolean; error?: string; points?: number };
      if (res?.ok) {
        result.cardsSynced += 1;
        if (res.points) result.dantesAwarded += res.points;
      } else if (res?.error) {
        result.errors.push(`Carta ${pc.code}: ${res.error}`);
      }
    } catch {
      result.errors.push(`Carta ${pc.code}: erro inesperado`);
    }
  }

  const pendingGames = getPendingGames();
  for (const pg of pendingGames) {
    try {
      const { data, error } = await supabase.rpc('award_game_win', {
        p_game_type: pg.gameType,
        p_game_id: pg.gameId,
        p_reward: pg.reward,
      });
      if (error) {
        result.errors.push(`Jogo ${pg.gameType}: ${error.message}`);
        continue;
      }
      const res = data as { success?: boolean; reason?: string };
      if (res?.success) {
        result.gamesSynced += 1;
        result.dantesAwarded += pg.reward;
      }
    } catch {
      result.errors.push(`Jogo ${pg.gameType}: erro inesperado`);
    }
  }

  clearPendingCards();
  clearPendingGames();
  clearPendingDantes();

  return result;
}
