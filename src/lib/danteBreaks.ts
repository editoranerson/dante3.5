import { supabase } from '@/lib/supabase';

export interface DanteBreak {
  id: string;
  name: string;
  start_time: string; // 'HH:MM' or 'HH:MM:SS'
  end_time: string;
  days: number[]; // 0 = domingo ... 6 = sábado
  message: string;
  is_active: boolean;
  created_at?: string;
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TZ = 'America/Sao_Paulo';

/** Hora atual em Brasília como minutos desde 00:00 e o dia da semana (0-6). */
export function brasiliaNow(date = new Date()): { minutes: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const hour = parseInt(get('hour'), 10) % 24;
  const minute = parseInt(get('minute'), 10);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { minutes: hour * 60 + minute, weekday: map[get('weekday')] ?? 0 };
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':');
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10);
}

/** Retorna o intervalo ativo agora, ou null. Suporta intervalos que cruzam a meia-noite. */
export function findActiveBreak(breaks: DanteBreak[], date = new Date()): DanteBreak | null {
  const { minutes, weekday } = brasiliaNow(date);
  for (const b of breaks) {
    if (!b.is_active) continue;
    const days = b.days?.length ? b.days : [0, 1, 2, 3, 4, 5, 6];
    const start = toMinutes(b.start_time);
    const end = toMinutes(b.end_time);
    if (start === end) continue;
    if (start < end) {
      if (days.includes(weekday) && minutes >= start && minutes < end) return b;
    } else {
      // cruza a meia-noite
      if (days.includes(weekday) && minutes >= start) return b;
      const prevDay = (weekday + 6) % 7;
      if (days.includes(prevDay) && minutes < end) return b;
    }
  }
  return null;
}

export async function fetchDanteBreaks(onlyActive = false): Promise<DanteBreak[]> {
  let query = supabase.from('dante_breaks').select('*').order('start_time', { ascending: true });
  if (onlyActive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as DanteBreak[];
}
