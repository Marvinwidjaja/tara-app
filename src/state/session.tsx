/**
 * Who is signed in (a parent or a caregiver) and what they need on launch.
 *
 * Parents: the family's data (caregivers, goals, activities, open alerts) from /api/bootstrap.
 * Caregivers: themselves, their family and unread count from /api/caregiver/me.
 * Refreshed every 15 s while the app is open, so the other side's updates show up without
 * pulling to refresh.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';

import { api, setAuthToken, setUnauthorizedHandler } from '@/lib/api';
import { loadSession, saveSession } from '@/lib/token-storage';
import type { Activity, Alert, Caregiver, CaregiverMe, Goal, Parent, Role } from '@/shared/types';

export type Bootstrap = {
  parent: Parent;
  today: string;
  caregivers: Caregiver[];
  goals: Goal[];
  activities: Activity[];
  alerts: Alert[];
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  childName: string;
  childAgeMonths: number;
};

/** 'unreachable': signed in on this device, but the backend couldn't be reached to load data. */
type Status = 'loading' | 'signed-out' | 'signed-in' | 'unreachable';

type State = { status: Status; role: Role | null; data: Bootstrap | null; me: CaregiverMe | null };

type SessionContextValue = State & {
  reload: () => Promise<void>;
  /** Try loading again after the backend was unreachable. */
  retry: () => Promise<void>;
  signIn: (role: Role, email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  /** A caregiver creates their login with the parent's invite code. */
  joinAsCaregiver: (code: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const REFRESH_MS = 15_000;
const SIGNED_OUT: State = { status: 'signed-out', role: null, data: null, me: null };

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<State>({ ...SIGNED_OUT, status: 'loading' });
  const sessionRef = useRef<{ token: string; role: Role } | null>(null);

  const clear = useCallback(async () => {
    sessionRef.current = null;
    setAuthToken(null);
    await saveSession(null);
    setState(SIGNED_OUT);
  }, []);

  const reload = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (session.role === 'parent') {
      const data = await api.get<Bootstrap>('/api/bootstrap');
      if (sessionRef.current === session) setState({ status: 'signed-in', role: 'parent', data, me: null });
    } else {
      const me = await api.get<CaregiverMe>('/api/caregiver/me');
      if (sessionRef.current === session) setState({ status: 'signed-in', role: 'caregiver', data: null, me });
    }
  }, []);

  const start = useCallback(
    async (token: string, role: Role) => {
      sessionRef.current = { token, role };
      setAuthToken(token);
      await saveSession({ token, role });
      await reload();
    },
    [reload]
  );

  // Restore a saved session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => void clear());
    (async () => {
      const saved = await loadSession();
      if (!saved) return setState(SIGNED_OUT);
      try {
        await start(saved.token, saved.role);
      } catch (err) {
        // Keep the token if the backend is just unreachable; drop it if it was rejected.
        if ((err as { status?: number }).status === 401) await clear();
        else setState({ status: 'unreachable', role: saved.role, data: null, me: null });
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [clear, start]);

  // Background refresh while the app is in the foreground.
  useEffect(() => {
    if (state.status !== 'signed-in') return;
    const tick = () => {
      if (AppState.currentState === 'active') reload().catch(() => {});
    };
    const interval = setInterval(tick, REFRESH_MS);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [state.status, reload]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      reload,
      retry: async () => {
        try {
          await reload();
        } catch (err) {
          if ((err as { status?: number }).status === 401) await clear();
          else throw err;
        }
      },
      signIn: async (role, email, password) => {
        const path = role === 'parent' ? '/api/auth/login' : '/api/auth/caregiver/login';
        const res = await api.post<{ token: string }>(path, { email, password });
        await start(res.token, role);
      },
      signUp: async (input) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await api.post<{ token: string }>('/api/auth/signup', { ...input, timezone });
        await start(res.token, 'parent');
      },
      joinAsCaregiver: async (code, email, password) => {
        const res = await api.post<{ token: string }>('/api/auth/caregiver/join', { code, email, password });
        await start(res.token, 'caregiver');
      },
      signOut: async () => {
        await api.post('/api/auth/logout').catch(() => {});
        await clear();
      },
    }),
    [state, reload, start, clear]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

/** The family's data. Only call from parent screens (behind the parent sign-in guard). */
export function useFamily() {
  const { data, reload } = useSession();
  return useMemo(() => {
    const d = data;
    return {
      ready: !!d,
      parent: d?.parent ?? null,
      today: d?.today ?? new Date().toISOString().slice(0, 10),
      caregivers: d?.caregivers ?? [],
      goals: d?.goals ?? [],
      activities: d?.activities ?? [],
      alerts: d?.alerts ?? [],
      caregiver: (id: string | null | undefined) => d?.caregivers.find((c) => c.id === id),
      goal: (id: string | null | undefined) => d?.goals.find((g) => g.id === id),
      activity: (id: string | null | undefined) => d?.activities.find((a) => a.id === id),
      reload,
    };
  }, [data, reload]);
}

/** The signed-in caregiver. Only call from caregiver screens (behind the caregiver sign-in guard). */
export function useCaregiver() {
  const { me, reload } = useSession();
  return useMemo(
    () => ({
      me,
      lang: me?.caregiver.language ?? 'en',
      today: me?.today ?? new Date().toISOString().slice(0, 10),
      reload,
    }),
    [me, reload]
  );
}
