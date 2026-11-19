import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { adminAuth, adminDb } from '../utils/firebase';

const setStatusSchema = z.object({
  uid: z.string().min(1),
  status: z.enum(['active', 'disabled']),
});

export const setUserStatus = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin']);
  const parsed = setStatusSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Status pengguna tidak valid.');
  }

  const { uid, status } = parsed.data;
  const userRef = adminDb.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Pengguna tidak ditemukan.');
  }

  const userData = userSnap.data() as {
    nama: string;
    jurusan: string;
    angkatan: number;
    whatsapp: string;
    isAslab: boolean;
    fakultas?: string | null;
    lab?: string | null;
    jadwalAslab?: string | null;
    photoURL?: string | null;
    role: string;
    status: string;
    activePeriods?: string[];
  };

  if (status === 'disabled' && userData.role === 'admin') {
    if (caller.uid === uid) {
      throw new HttpsError(
        'failed-precondition',
        'Tidak dapat menonaktifkan akun Anda sendiri.',
      );
    }
    const activeAdmins = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .where('status', '==', 'active')
      .get();

    if (activeAdmins.size <= 1) {
      throw new HttpsError(
        'failed-precondition',
        'Tidak dapat menonaktifkan admin terakhir.',
      );
    }
  }

  await adminAuth.updateUser(uid, {
    disabled: status === 'disabled',
  });
  await adminAuth.setCustomUserClaims(uid, {
    role: userData.role,
    status,
  });

  const batch = adminDb.batch();
  batch.update(userRef, {
    status,
    claimsUpdatedAt: FieldValue.serverTimestamp(),
  });

  const memberRef = adminDb.doc(`members/${uid}`);
  if (status === 'disabled') {
    batch.delete(memberRef);
  } else {
    batch.set(
      memberRef,
      {
        uid,
        nama: userData.nama,
        jurusan: userData.jurusan,
        angkatan: userData.angkatan,
        isAslab: Boolean(userData.isAslab),
        fakultas: userData.isAslab ? userData.fakultas || null : null,
        lab: userData.isAslab ? userData.lab || null : null,
        jadwalAslab: userData.isAslab ? userData.jadwalAslab || null : null,
        whatsappAslab: userData.isAslab ? userData.whatsapp : null,
        photoURL: userData.photoURL || null,
        role: userData.role,
        activePeriods: userData.activePeriods || ['2025-2026'],
        searchName: userData.nama.trim().toLowerCase(),
      },
      { merge: true },
    );
  }

  await batch.commit();

  await writeAuditLog({
    actorUid: caller.uid,
    action: 'user:set_status',
    target: `users/${uid}`,
    before: { status: userData.status },
    after: { status },
  });

  return { ok: true, uid, status };
});
