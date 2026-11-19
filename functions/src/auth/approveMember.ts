import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { adminAuth, adminDb } from '../utils/firebase';
import { roleSchema } from '../utils/validation';

const approveSchema = z.object({
  uid: z.string().min(1, 'ID pengguna wajib diisi.'),
  role: roleSchema,
});

async function getCurrentPeriodId(): Promise<string> {
  const snap = await adminDb
    .collection('periods')
    .where('isCurrent', '==', true)
    .limit(1)
    .get();
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  return '2025-2026';
}

export const approveMember = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin']);
  const parsed = approveSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Data persetujuan tidak valid.');
  }

  const { uid, role } = parsed.data;
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
    activePeriods?: string[];
  };

  const currentPeriodId = await getCurrentPeriodId();
  const nextPeriods = Array.from(
    new Set([...(userData.activePeriods || []), currentPeriodId]),
  );

  await adminAuth.setCustomUserClaims(uid, {
    role,
    status: 'active',
  });

  const batch = adminDb.batch();
  batch.update(userRef, {
    role,
    status: 'active',
    activePeriods: nextPeriods,
    approvedAt: FieldValue.serverTimestamp(),
    approvedBy: caller.uid,
    rejectReason: null,
    claimsUpdatedAt: FieldValue.serverTimestamp(),
  });

  const memberRef = adminDb.doc(`members/${uid}`);
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
      role,
      activePeriods: nextPeriods,
      searchName: userData.nama.trim().toLowerCase(),
    },
    { merge: true },
  );

  await batch.commit();

  await writeAuditLog({
    actorUid: caller.uid,
    action: 'user:approve',
    target: `users/${uid}`,
    before: { status: 'pending' },
    after: { status: 'active', role, nama: userData.nama },
  });

  return { ok: true, uid, role, status: 'active' };
});
