import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { adminAuth, adminDb } from '../utils/firebase';
import { roleSchema } from '../utils/validation';

const setRoleSchema = z.object({
  uid: z.string().min(1),
  role: roleSchema,
});

export const setUserRole = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin']);
  const parsed = setRoleSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Input perubahan peran tidak valid.');
  }

  const { uid, role } = parsed.data;
  const userRef = adminDb.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Pengguna tidak ditemukan.');
  }

  const currentData = userSnap.data() as {
    role: string;
    status: string;
  };

  if (caller.uid === uid && currentData.role === 'admin' && role !== 'admin') {
    const activeAdmins = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .where('status', '==', 'active')
      .get();

    if (activeAdmins.size <= 1) {
      throw new HttpsError(
        'failed-precondition',
        'Tidak dapat menurunkan peran admin terakhir.',
      );
    }
  }

  await adminAuth.setCustomUserClaims(uid, {
    role,
    status: currentData.status,
  });

  const batch = adminDb.batch();
  batch.update(userRef, {
    role,
    claimsUpdatedAt: FieldValue.serverTimestamp(),
  });

  const memberRef = adminDb.doc(`members/${uid}`);
  const memberSnap = await memberRef.get();
  if (memberSnap.exists) {
    batch.update(memberRef, { role });
  }

  await batch.commit();

  await writeAuditLog({
    actorUid: caller.uid,
    action: 'user:set_role',
    target: `users/${uid}`,
    before: { role: currentData.role },
    after: { role },
  });

  return { ok: true, uid, role };
});
