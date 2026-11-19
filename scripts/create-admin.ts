import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { generateReferralPayload } from '../functions/src/utils/referral';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return undefined;
}

const username = (getArg('--username') || process.env.ADMIN_USERNAME || 'AdminHimasri').trim();
const displayName = (getArg('--nama') || process.env.ADMIN_DISPLAY_NAME || 'Admin').trim();
const password = process.env.ADMIN_PASSWORD || '';

if (!password) {
  console.error(
    'Error: Variabel lingkungan ADMIN_PASSWORD wajib diisi sebelum menjalankan skrip ini.',
  );
  console.error(
    'Contoh PowerShell: $env:ADMIN_PASSWORD="..."; npm run create:admin',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: ADMIN_PASSWORD minimal 8 karakter.');
  process.exit(1);
}

if (!/^[a-zA-Z][a-zA-Z0-9._-]{2,39}$/.test(username)) {
  console.error('Error: Username tidak valid (3-40 karakter alfanumerik, diawali huruf).');
  process.exit(1);
}

const email = `${username.toLowerCase()}@himasri.app`;
const projectId =
  getArg('--project') ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  'demo-himasri';

const useEmulator =
  process.argv.includes('--emulator') ||
  Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
  projectId.startsWith('demo-');

if (useEmulator) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  }
}

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const auth = getAuth();
const db = getFirestore();

async function main() {
  let uid = '';
  let action: 'created' | 'updated' = 'created';

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    action = 'updated';
    await auth.updateUser(uid, {
      displayName,
      password,
      disabled: false,
    });
  } catch {
    const created = await auth.createUser({
      email,
      password,
      displayName,
    });
    uid = created.uid;
  }

  await auth.setCustomUserClaims(uid, { role: 'admin', status: 'active' });

  const nowYear = new Date().getFullYear();

  await db.doc(`users/${uid}`).set(
    {
      uid,
      nama: displayName,
      nim: '',
      angkatan: nowYear,
      jurusan: 'Administrator HIMASRI',
      whatsapp: '',
      isAslab: false,
      fakultas: null,
      lab: null,
      jadwalAslab: null,
      requestedPosition: 'Admin',
      role: 'admin',
      status: 'active',
      activePeriods: [],
      referralCodeId: 'ADMIN_SCRIPT',
      rejectReason: null,
      claimsUpdatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: 'create-admin',
    },
    { merge: true },
  );

  await db.doc(`members/${uid}`).set(
    {
      uid,
      nama: displayName,
      jurusan: 'Administrator HIMASRI',
      angkatan: nowYear,
      isAslab: false,
      fakultas: null,
      lab: null,
      jadwalAslab: null,
      whatsappAslab: null,
      role: 'admin',
      activePeriods: [],
      searchName: displayName.toLowerCase(),
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
      rotatedBy: 'create-admin',
    });
    console.log(`[create-admin] Kode referal awal dibuat: ${payload.code}`);
  }

  console.log(
    `[create-admin] Akun admin ${action}: username=${username}, email=${email}, uid=${uid}, project=${projectId}, emulator=${useEmulator}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[create-admin] Gagal:', err);
  process.exit(1);
});
