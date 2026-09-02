import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  refCode: string;
  retentionSeconds: number;
}

const SS_REF_CODE = 'aff_ref_code';
const SS_ENTRY_TIME = 'aff_entry_time';
const SS_VISIT_ID = 'aff_visit_id';
const SS_CONFIRMED = 'aff_retention_confirmed';

export function ReferralTracker({ refCode, retentionSeconds }: Props) {
  const [visitId, setVisitId] = useState<string | null>(
    () => sessionStorage.getItem(SS_VISIT_ID),
  );
  const confirmedRef = useRef(sessionStorage.getItem(SS_CONFIRMED) === 'true');

  // Effect 1: Create the visit record once per ref code (does NOT depend on retentionSeconds)
  useEffect(() => {
    if (!refCode) return;

    const existingCode = sessionStorage.getItem(SS_REF_CODE);
    const existingVisitId = sessionStorage.getItem(SS_VISIT_ID);

    // If we already have a visit for this ref code, keep it
    if (existingCode === refCode && existingVisitId) {
      setVisitId(existingVisitId);
      return;
    }

    // New tracking session
    const entryTime = Date.now();
    sessionStorage.setItem(SS_REF_CODE, refCode);
    sessionStorage.setItem(SS_ENTRY_TIME, String(entryTime));
    sessionStorage.setItem(SS_CONFIRMED, 'false');
    sessionStorage.removeItem(SS_VISIT_ID);

    (async () => {
      try {
        const { data, error } = await supabase.rpc('track_affiliate_visit', {
          p_code: refCode,
          p_ip_hash: 'browser_' + entryTime,
          p_session: 'sess_' + entryTime,
        });
        if (error) return;
        const result = data as { ok: boolean; visit_id?: string };
        if (result?.ok && result.visit_id) {
          sessionStorage.setItem(SS_VISIT_ID, result.visit_id);
          setVisitId(result.visit_id);
        }
      } catch {
        // ignore
      }
    })();
  }, [refCode]);

  // Effect 2: Start / restore the retention timer (depends on visitId + retentionSeconds)
  useEffect(() => {
    if (!visitId || confirmedRef.current) return;

    const entryTimeStr = sessionStorage.getItem(SS_ENTRY_TIME);
    if (!entryTimeStr) return;

    const elapsed = Math.floor((Date.now() - parseInt(entryTimeStr, 10)) / 1000);
    const remaining = retentionSeconds - elapsed;

    if (remaining <= 0) {
      confirmRetention(visitId);
      return;
    }

    const timer = setTimeout(() => confirmRetention(visitId), remaining * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId, retentionSeconds]);

  async function confirmRetention(vid: string) {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    sessionStorage.setItem(SS_CONFIRMED, 'true');

    try {
      await supabase.rpc('confirm_visit_retention', { p_visit_id: vid });
    } catch {
      // ignore
    }
  }

  return null;
}
