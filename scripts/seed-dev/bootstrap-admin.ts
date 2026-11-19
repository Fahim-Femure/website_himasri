import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { nimToEmail } from '../../functions/src/utils/nim';
import { generateReferralPayload } from '../../functions/src/utils/referral';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return undefined;
}

const nim = getArg('--nim');
const nama = getArg('--nama');
const password = getArg('--password');
const jurusan = getArg('--jurusan') || 'S1 Teknik Informatika';
const angkatan = Number(getArg('--angkatan') || new Date().getFullYear());
const whatsapp = getArg('--whatsapp') || '6281234567800';

if (!nim || !nama || !password) {
  console.error(
    'Pemakaian: npm run bootstrap:admin -- --nim <NIM> --nama "<Nama Lengkap>" --password <Password>',
  );
  process.exit(1);
}

if (!/^\d{9,12}$/.test(nim)) {
  console.error('Error: NIM harus berupa 9–12 digit angka.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: Kata sandi minimal 8 karakter.');
  process.exit(1);
}

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-himasri';
if (!process.env.FIRESTORE_EMULATOR_HOST && projectId.startsWith('demo-')) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
}

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const auth = getAuth();
const db = getFirestore();
async function main() {
  const email = nimToEmail(nim!);

  let uid = '';
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { displayName: nama, password, disabled: false });
  } catch {
    const created = await auth.createUser({ email, password, displayName: nama });
    uid = created.uid;
  }

  await auth.setCustomUserClaims(uid, { role: 'admin', status: 'active' });

  await db.doc(`users/${uid}`).set(
    {
      uid,
      nama,
      nim,
      angkatan,
      jurusan,
      whatsapp,
      isAslab: false,
      fakultas: null,
      lab: null,
      jadwalAslab: null,
      requestedPosition: 'Admin',
      role: 'admin',
      status: 'active',
      activePeriods: ['2025-2026'],
      referralCodeId: 'BOOTSTRAP',
      rejectReason: null,
      claimsUpdatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: 'bootstrap',
    },
    { merge: true },
  );

  await db.doc(`nimIndex/${nim}`).set({
    uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.doc(`members/${uid}`).set(
    {
      uid,
      nama,
      jurusan,
      angkatan,
      isAslab: false,
      fakultas: null,
      lab: null,
      jadwalAslab: null,
      whatsappAslab: null,
      role: 'admin',
      activePeriods: ['2025-2026'],
      searchName: nama!.trim().toLowerCase(),
    },
    { merge: true },
  );

  const referralSnap = await db.doc('secure/referral').get();
  if (!referralSnap.exists) {
    const payload = generateReferralPayload(new Date());
    await db.doc('secure/referral').set({
      code: payload.code,
      periodLabel: payload.periodLabel,
      validFrom: Timestamp.fromDate(payload.validFrom),
      validUntil: Timestamp.fromDate(payload.validUntil),
      usedCount: 0,
      rotatedAt: FieldValue.serverTimestamp(),
      rotatedBy: 'bootstrap',
    });
    console.log(`[bootstrap] Kode referal awal dibuat: ${payload.code}`);
  }

  console.log(`[bootstrap] Admin siap! NIM=${nim}, UID=${uid}, Project=${projectId}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[bootstrap] Error:', err);
  process.exit(1);
});
