import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { adminDb } from '../utils/firebase';

const updateAslabSchema = z.object({
  uid: z.string().min(1),
  isAslab: z.boolean(),
  fakultas: z.string().max(120).optional().default(''),
  lab: z.string().max(120).optional().default(''),
  jadwalAslab: z.string().max(160).optional().default(''),
  whatsappAslab: z.string().max(30).optional().default(''),
});

export const updateAslab = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin']);
  const parsed = updateAslabSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Data asisten lab tidak valid.');
  }

  const { uid, isAslab, fakultas, lab, jadwalAslab, whatsappAslab } = parsed.data;
  const userRef = adminDb.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Pengguna tidak ditemukan.');
  }

  const beforeData = userSnap.data() as Record<string, unknown>;
  const updates = {
    isAslab,
    fakultas: isAslab ? fakultas.trim() : '',
    lab: isAslab ? lab.trim() : '',
    jadwalAslab: isAslab ? jadwalAslab.trim() : '',
    whatsappAslab: isAslab ? whatsappAslab.trim() : '',
    updatedAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();
  batch.update(userRef, updates);

  const memberRef = adminDb.doc(`members/${uid}`);
  const memberSnap = await memberRef.get();
  if (memberSnap.exists) {
    batch.update(memberRef, {
      isAslab: updates.isAslab,
      fakultas: updates.fakultas,
      lab: updates.lab,
      jadwalAslab: updates.jadwalAslab,
      whatsappAslab: updates.whatsappAslab,
    });
  }

  await batch.commit();

  await writeAuditLog({
    actorUid: caller.uid,
    action: 'aslab:update',
    target: `users/${uid}`,
    before: {
      isAslab: beforeData.isAslab ?? false,
      fakultas: beforeData.fakultas ?? '',
      lab: beforeData.lab ?? '',
    },
    after: {
      isAslab: updates.isAslab,
      fakultas: updates.fakultas,
      lab: updates.lab,
    },
  });

  return { ok: true, uid, isAslab };
});
