import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminAuth, adminDb } from '../utils/firebase';
import { nimToEmail, normalizeReferralCode } from '../utils/nim';
import { enforceRateLimit } from '../utils/rateLimit';
import { registerMemberSchema } from '../utils/validation';

export const registerMember = onCall(
  {
    region: 'asia-southeast2',
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
  },
  async (request) => {
  const ip = request.rawRequest?.ip || 'unknown';
  await enforceRateLimit(ip, 'registerMember', 10, 10 * 60 * 1000);

  const parsed = registerMemberSchema.safeParse(request.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Data pendaftaran tidak valid.';
    throw new HttpsError('invalid-argument', firstIssue, {
      reason: 'invalid-argument',
      issues: parsed.error.issues,
    });
  }

  const input = parsed.data;
  const normalizedCode = normalizeReferralCode(input.referralCode);

  const referralRef = adminDb.doc('secure/referral');
  const nimRef = adminDb.doc(`nimIndex/${input.nim}`);

  const [referralSnap, nimSnap] = await Promise.all([referralRef.get(), nimRef.get()]);

  if (!referralSnap.exists) {
    throw new HttpsError(
      'invalid-argument',
      'Kode referal belum tersedia. Hubungi pengurus HIMASRI.',
      { reason: 'invalid-referral' },
    );
  }

  const referralData = referralSnap.data() as {
    code?: string;
    periodLabel?: string;
    validUntil?: Timestamp;
  };

  if (
    !referralData.code ||
    !referralData.validUntil ||
    normalizeReferralCode(referralData.code) !== normalizedCode ||
    Date.now() >= referralData.validUntil.toMillis()
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Kode referal tidak valid atau sudah kedaluwarsa. Minta kode terbaru ke pengurus.',
      { reason: 'invalid-referral' },
    );
  }

  if (nimSnap.exists) {
    throw new HttpsError(
      'already-exists',
      'NIM sudah terdaftar. Silakan masuk atau hubungi admin.',
      { reason: 'nim-exists' },
    );
  }

  const email = nimToEmail(input.nim);
  let createdUid = '';

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password: input.password,
      displayName: input.nama,
    });
    createdUid = userRecord.uid;
    await adminAuth.setCustomUserClaims(createdUid, {
      role: 'anggota',
      status: 'pending',
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/email-already-exists') {
      throw new HttpsError(
        'already-exists',
        'NIM sudah terdaftar. Silakan masuk atau hubungi admin.',
        { reason: 'nim-exists' },
      );
    }
    throw new HttpsError('internal', 'Gagal membuat akun. Silakan coba lagi.');
  }

  try {
    await adminDb.runTransaction(async (tx) => {
      const txNim = await tx.get(nimRef);
      if (txNim.exists) {
        throw new HttpsError(
          'already-exists',
          'NIM sudah terdaftar. Silakan masuk atau hubungi admin.',
          { reason: 'nim-exists' },
        );
      }

      const txRef = await tx.get(referralRef);
      const txRefData = txRef.data() as {
        code?: string;
        validUntil?: Timestamp;
      } | undefined;

      if (
        !txRef.exists ||
        !txRefData?.code ||
        !txRefData?.validUntil ||
        normalizeReferralCode(txRefData.code) !== normalizedCode ||
        Date.now() >= txRefData.validUntil.toMillis()
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Kode referal tidak valid atau sudah kedaluwarsa.',
          { reason: 'invalid-referral' },
        );
      }

      const userDocRef = adminDb.doc(`users/${createdUid}`);
      tx.set(userDocRef, {
        uid: createdUid,
        nama: input.nama,
        nim: input.nim,
        angkatan: input.angkatan,
        jurusan: input.jurusan,
        whatsapp: input.whatsapp,
        isAslab: input.isAslab,
        fakultas: input.isAslab ? input.fakultas ?? null : null,
        lab: input.isAslab ? input.lab ?? null : null,
        jadwalAslab: input.isAslab ? input.jadwalAslab || null : null,
        requestedPosition: input.requestedPosition || 'Anggota',
        photoURL: null,
        role: 'anggota',
        status: 'pending',
        activePeriods: [],
        referralCodeId: txRefData.code,
        rejectReason: null,
        claimsUpdatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        approvedAt: null,
        approvedBy: null,
      });

      tx.set(nimRef, {
        uid: createdUid,
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.update(referralRef, {
        usedCount: FieldValue.increment(1),
      });
    });

    return { uid: createdUid, status: 'pending' };
  } catch (err) {
    if (createdUid) {
      await adminAuth.deleteUser(createdUid).catch(() => {});
    }
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError('internal', 'Terjadi kesalahan saat menyimpan pendaftaran.');
  }
});
