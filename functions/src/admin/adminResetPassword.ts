import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { adminAuth, adminDb } from '../utils/firebase';
import { generateTempPassword } from '../utils/referral';

const resetPasswordSchema = z.object({
  uid: z.string().min(1),
});

export const adminResetPassword = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin']);
  const parsed = resetPasswordSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'ID pengguna wajib diisi.');
  }

  const { uid } = parsed.data;
  const userSnap = await adminDb.doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Pengguna tidak ditemukan.');
  }

  const tempPassword = generateTempPassword(10);
  await adminAuth.updateUser(uid, { password: tempPassword });

  await writeAuditLog({
    actorUid: caller.uid,
    action: 'user:reset_password',
    target: `users/${uid}`,
    after: { reset: true },
  });

  return { tempPassword };
});
