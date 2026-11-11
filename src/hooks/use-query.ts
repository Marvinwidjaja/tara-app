import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { api, errorMessage } from '@/lib/api';

type Result<T> = { path: string | null; data: T | null; error: string | null };

/**
 * GET `path` from the TARA server. Refetches when the screen regains focus, when `path`
 * changes, and every `pollMs` while the screen is focused (for incoming WhatsApp replies).
 * Results are tagged with their path, so a stale day's data is never shown for another day.
 */
export function useQuery<T>(path: string | null, { pollMs }: { pollMs?: number } = {}) {
  const [result, setResult] = useState<Result<T>>({ path: null, data: null, error: null });
  const pathRef = useRef(path);

  const reload = useCallback(async () => {
    const current = pathRef.current;
    if (!current) return;
    try {
      const data = await api.get<T>(current);
      if (pathRef.current === current) setResult({ path: current, data, error: null });
    } catch (err) {
      if (pathRef.current === current) {
        setResult((r) => ({ path: current, data: r.path === current ? r.data : null, error: errorMessage(err) }));
      }
    }
  }, []);

  useEffect(() => {
    pathRef.current = path;
    void reload();
  }, [path, reload]);

  useFocusEffect(
    useCallback(() => {
      if (!pollMs) return;
      const interval = setInterval(() => {
        if (AppState.currentState === 'active') void reload();
      }, pollMs);
      return () => clearInterval(interval);
    }, [pollMs, reload])
  );

  // Refresh when coming back to the screen (e.g. after closing an edit modal).
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void reload();
      focusedOnce.current = true;
    }, [reload])
  );

  const fresh = result.path === path;
  return {
    data: fresh ? result.data : null,
    error: fresh ? result.error : null,
    loading: !!path && !fresh,
    reload,
  };
}
