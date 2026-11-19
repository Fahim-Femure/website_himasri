import crypto from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { adminDb } from './firebase';

export async function enforceRateLimit(
  ipAddress: string,
  action: string,
  maxAttempts = 10,
  windowMs = 10 * 60 * 1000,
): Promise<void> {
  const hash = crypto.createHash('sha256').update(`${action}:${ipAddress}`).digest('hex');
  const ref = adminDb.collection('rateLimits').doc(hash);
  const nowMs = Date.now();

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      tx.set(ref, {
        count: 1,
        windowStart: Timestamp.fromMillis(nowMs),
      });
      return;
    }

    const data = snap.data() as { count?: number; windowStart?: Timestamp };
    const startMs = data.windowStart?.toMillis?.() ?? 0;
    const count = data.count ?? 0;

    if (nowMs - startMs > windowMs) {
      tx.set(ref, {
        count: 1,
        windowStart: Timestamp.fromMillis(nowMs),
      });
      return;
    }

    if (count >= maxAttempts) {
      throw new HttpsError(
        'resource-exhausted',
        'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
      );
    }

    tx.update(ref, { count: count + 1 });
  });
}
