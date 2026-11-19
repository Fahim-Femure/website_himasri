import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { adminAuth, adminDb, adminStorage } from '../utils/firebase';

const rejectSchema = z.object({
  uid: z.string().min(1, 'ID pengguna wajib diisi.'),
  reason: z.string().trim().max(300).optional(),
});

export const rejectMember = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin']);
  const parsed = rejectSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Data penolakan tidak valid.');
  }

  const { uid, reason } = parsed.data;
  const userRef = adminDb.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Pengguna tidak ditemukan.');
  }

  const userData = userSnap.data() as { nim?: string };

  // Step 1: update user document first so open waiting page shows rejection message immediately
  await userRef.update({
    status: 'rejected',
    rejectReason:
      reason && reason.length > 0
        ? reason
        : 'Pendaftaran tidak dapat diverifikasi. Hubungi pengurus HIMASRI.',
    claimsUpdatedAt: FieldValue.serverTimestamp(),
  });

  // Step 2: remove NIM index & delete Auth user so the same NIM can re-register
  const cleanupTasks: Array<Promise<unknown>> = [
    adminDb.doc(`members/${uid}`).delete().catch(() => {}),
    adminStorage
      .bucket()
      .file(`avatars/${uid}.webp`)
      .delete({ ignoreNotFound: true })
      .catch(() => {}),
    adminAuth.deleteUser(uid).catch((err: { code?: string }) => {
      if (err?.code !== 'auth/user-not-found') {
        throw err;
      }
    }),
  ];

  if (userData.nim) {
    cleanupTasks.push(adminDb.doc(`nimIndex/${userData.nim}`).delete());
  }

  await Promise.all(cleanupTasks);

  await writeAuditLog({
    actorUid: caller.uid,
    action: 'user:reject',
    target: `users/${uid}`,
    before: { status: 'pending', nim: userData.nim ?? '' },
    after: { status: 'rejected', reason: reason ?? '' },
  });

  return { ok: true, uid, status: 'rejected' };
});
