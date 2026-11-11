/**
 * Client for the TARA backend (../TARA_backend, `npm run dev` there).
 *
 * Where the backend is: EXPO_PUBLIC_API_URL if set (always, for deployed builds; see vercel.json),
 * otherwise the machine running the Expo dev server on port 4000. That works for the iOS Simulator, Android Emulator, web and a phone on
 * the same Wi‑Fi using Expo Go.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PORT = 4000;

function resolveBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${PORT}`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${PORT}`;
  // The Android Emulator reaches the host machine at 10.0.2.2.
  return Platform.OS === 'android' ? `http://10.0.2.2:${PORT}` : `http://localhost:${PORT}`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Called when the server says the session is no longer valid. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Give up on a request after this long (e.g. a phone that can't see the dev machine). */
const TIMEOUT_MS = 15_000;

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, unreachableMessage());
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    if (res.status === 401 && authToken) onUnauthorized?.();
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status}).`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export const unreachableMessage = () =>
  __DEV__
    ? `Can't reach the TARA backend at ${API_URL}. Start it with "npm run dev" in TARA_backend, and check this device is on the same Wi‑Fi.`
    : 'Can’t reach TARA right now. Check your internet connection and try again.';

/** True when the request failed because the backend couldn't be reached at all. */
export const isUnreachable = (err: unknown) => err instanceof ApiError && err.status === 0;

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';
