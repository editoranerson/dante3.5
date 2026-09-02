import { supabase } from './supabase';

export interface DantePowerState {
  enabled: boolean;
  message: string;
}

const KEY = 'dante_power';
const DEFAULT: DantePowerState = {
  enabled: true,
  message: '',
};

export async function fetchDantePower(): Promise<DantePowerState> {
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', KEY)
    .maybeSingle();
  if (!data?.value) return { ...DEFAULT };
  try {
    const parsed = JSON.parse(data.value) as Partial<DantePowerState>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      message: typeof parsed.message === 'string' ? parsed.message : '',
    };
  } catch {
    return { ...DEFAULT };
  }
}

export async function setDantePower(state: DantePowerState): Promise<boolean> {
  const { error } = await supabase
    .from('site_content')
    .upsert(
      { key: KEY, value: JSON.stringify(state), updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );
  return !error;
}
