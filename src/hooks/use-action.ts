import { useCallback, useState } from 'react';

import { errorMessage } from '@/lib/api';
import { notify } from '@/lib/notify';

/** Runs a server action, tracks which one is busy (to disable its button) and shows errors. */
export function useAction() {
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(async <T>(key: string, fn: () => Promise<T>, success?: string) => {
    setBusy(key);
    try {
      const result = await fn();
      if (success) notify(success);
      return result;
    } catch (err) {
      notify('Something went wrong', errorMessage(err));
      return undefined;
    } finally {
      setBusy(null);
    }
  }, []);

  return { busy, run };
}
