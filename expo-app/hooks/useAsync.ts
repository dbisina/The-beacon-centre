import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tiny fetch-state hook. Every screen uses this so loading, empty and error
 * states are consistent, and a failed network call shows placeholder content
 * instead of an empty screen — important on Nigerian mobile data.
 */
export function useAsync<T>(fn: () => Promise<T>, fallback: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (alive.current) setData(result);
    } catch (e: any) {
      if (alive.current) setError(e?.message ?? 'Something went wrong');
    } finally {
      if (alive.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    alive.current = true;
    run();
    return () => {
      alive.current = false;
    };
  }, [run]);

  return { data, loading, error, refresh: run };
}
