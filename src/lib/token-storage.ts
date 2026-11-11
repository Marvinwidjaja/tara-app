/** Keeps the session (token + who signed in) in the Keychain / Keystore on devices and localStorage on web. */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Role } from '@/shared/types';

const KEY = 'cocare.session';

export type StoredSession = { token: string; role: Role };

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = Platform.OS === 'web' ? (globalThis.localStorage?.getItem(KEY) ?? null) : await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    // Sessions saved before caregiver accounts existed are a bare parent token.
    if (!raw.startsWith('{')) return { token: raw, role: 'parent' };
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    return parsed.token && (parsed.role === 'parent' || parsed.role === 'caregiver') ? { token: parsed.token, role: parsed.role } : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession | null) {
  const value = session ? JSON.stringify(session) : null;
  try {
    if (Platform.OS === 'web') {
      if (value) globalThis.localStorage?.setItem(KEY, value);
      else globalThis.localStorage?.removeItem(KEY);
      return;
    }
    if (value) await SecureStore.setItemAsync(KEY, value);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Storage can fail (private browsing, locked keychain); the session just won't persist.
  }
}
