import { Timestamp } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../utils/firebase';
import { normalizeReferralCode } from '../utils/nim';
import { enforceRateLimit } from '../utils/rateLimit';

export const checkReferralCode = onCall(
  {
    region: 'asia-southeast2',
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
  },
  async (request) => {
  const ip = request.rawRequest?.ip || 'unknown';
  await enforceRateLimit(ip, 'checkReferralCode', 10, 10 * 60 * 1000);

  const rawCode = typeof request.data?.code === 'string' ? request.data.code : '';
  const candidate = normalizeReferralCode(rawCode);
  if (!candidate) {
    return { valid: false };
  }

  const refSnap = await adminDb.doc('secure/referral').get();
  if (!refSnap.exists) {
    return { valid: false };
  }

  const refData = refSnap.data() as {
    code?: string;
    validUntil?: Timestamp;
  };

  if (!refData.code || !refData.validUntil) {
    return { valid: false };
  }

  const nowMs = Date.now();
  const validUntilMs = refData.validUntil.toMillis();
  const matches = normalizeReferralCode(refData.code) === candidate && nowMs < validUntilMs;

  if (!matches) {
    return { valid: false };
  }

  return {
    valid: true,
    validUntil: refData.validUntil.toDate().toISOString(),
  };
});
