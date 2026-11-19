import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { adminAuth, adminDb } from '../utils/firebase';

const updatePhotoSchema = z.object({
  photoURL: z.string().url('URL foto profil tidak valid.').max(1000).nullable(),
});

export const updateUserPhoto = onCall({ region: 'asia-southeast2' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk terlebih dahulu.');
  }

  const parsed = updatePhotoSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'URL foto profil tidak valid.');
  }

  const uid = request.auth.uid;
  const { photoURL } = parsed.data;

  const userRef = adminDb.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Data pengguna tidak ditemukan.');
  }

  await adminAuth.updateUser(uid, {
    photoURL: photoURL || undefined,
  });

  const batch = adminDb.batch();
  batch.update(userRef, { photoURL });

  const memberRef = adminDb.doc(`members/${uid}`);
  const memberSnap = await memberRef.get();
  if (memberSnap.exists) {
    batch.update(memberRef, { photoURL });
  }

  await batch.commit();

  return { ok: true, photoURL };
});
