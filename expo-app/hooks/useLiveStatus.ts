import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchLiveStatus, LiveStatus } from '@/services/youtube';

const FALLBACK: LiveStatus = { live: false, upcoming: false, source: 'none', checkedAt: new Date(0).toISOString() };

/**
 * Polls GET /api/live/status while the calling screen is focused and the app
 * is in the foreground, and refreshes immediately on focus and on returning
 * to foreground. There is no push channel yet for "we just went live" (that
 * is a separate, later change - see docs/app-store-resubmission.md), so
 * polling while looking at the screen is how the Live tab and the home tile
 * find out.
 *
 * A failed poll keeps the last known status rather than resetting to
 * `{live:false}` - a single dropped request on bad mobile data shouldn't
 * flash "not live" over a stream that is actually still running.
 */
export function useLiveStatus(intervalMs: number) {
  const [status, setStatus] = useState<LiveStatus>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    if (alive.current) setLoading(true);
    try {
      const next = await fetchLiveStatus();
      if (alive.current) setStatus(next);
    } catch {
      // keep the previous status
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      refresh();
      const interval = setInterval(refresh, intervalMs);
      const sub = AppState.addEventListener('change', (next) => {
        if (next === 'active') refresh();
      });
      return () => {
        alive.current = false;
        clearInterval(interval);
        sub.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs])
  );

  return { status, loading, refresh };
}
