import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../utils/firebase';
import { generateReferralPayload } from '../utils/referral';

export async function performReferralRotation(
  endedReason: 'rotated' | 'regenerated',
  rotatedBy: string,
  referenceDate = new Date(),
) {
  const referralRef = adminDb.doc('secure/referral');
  const historyCol = adminDb.collection('referralHistory');

  const nextPayload = generateReferralPayload(referenceDate);

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(referralRef);
    if (snap.exists) {
      const oldData = snap.data() as {
        code: string;
        periodLabel: string;
        validFrom: Timestamp;
        validUntil: Timestamp;
        usedCount?: number;
      };

      const historyDoc = historyCol.doc();
      tx.set(historyDoc, {
        code: oldData.code,
        periodLabel: oldData.periodLabel,
        validFrom: oldData.validFrom,
        validUntil: oldData.validUntil,
        usedCount: oldData.usedCount ?? 0,
        endedReason,
        archivedAt: FieldValue.serverTimestamp(),
      });
    }

    tx.set(referralRef, {
      code: nextPayload.code,
      periodLabel: nextPayload.periodLabel,
      validFrom: Timestamp.fromDate(nextPayload.validFrom),
      validUntil: Timestamp.fromDate(nextPayload.validUntil),
      usedCount: 0,
      rotatedAt: FieldValue.serverTimestamp(),
      rotatedBy,
    });
  });

  return {
    code: nextPayload.code,
    periodLabel: nextPayload.periodLabel,
    validFrom: nextPayload.validFrom.toISOString(),
    validUntil: nextPayload.validUntil.toISOString(),
  };
}
