import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase/client';

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

export async function callBackendRpc<TInput, TOutput>(
  action: string,
  data?: TInput,
): Promise<TOutput> {
  if (useEmulators) {
    const fn = httpsCallable<TInput | undefined, TOutput>(functions, action);
    const res = await fn(data);
    return res.data;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch('/api/rpc', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, data: data ?? {} }),
  });

  const payload = (await resp.json().catch(() => ({}))) as {
    data?: TOutput;
    error?: { code?: string; message?: string; details?: Record<string, unknown> };
  };

  if (!resp.ok || payload.error) {
    const err = new Error(payload.error?.message || 'Terjadi kesalahan pada server.') as Error & {
      code?: string;
      details?: Record<string, unknown>;
    };
    err.code = payload.error?.code || 'functions/internal';
    err.details = payload.error?.details;
    throw err;
  }

  return payload.data as TOutput;
}
