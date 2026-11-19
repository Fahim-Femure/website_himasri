import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

type Role = 'anggota' | 'psdm' | 'minat_bakat' | 'akademik' | 'kominfo' | 'inti' | 'admin';

const ALL_ROLES = new Set<Role>([
  'anggota',
  'psdm',
  'minat_bakat',
  'akademik',
  'kominfo',
  'inti',
  'admin',
]);

function initFirebaseAdmin() {
  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT belum dikonfigurasi di server.');
    }
    const jsonStr = raw.trim().startsWith('{')
      ? raw.trim()
      : Buffer.from(raw.trim(), 'base64').toString('utf8');
    const serviceAccount = JSON.parse(jsonStr);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }
  return {
    adminAuth: getAuth(),
    adminDb: getFirestore(),
  };
}

class RpcError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const MONTH_WINDOWS = [
  { startCode: 'JAN', labelPair: 'Jan – Feb' },
  { startCode: 'MAR', labelPair: 'Mar – Apr' },
  { startCode: 'MEI', labelPair: 'Mei – Jun' },
  { startCode: 'JUL', labelPair: 'Jul – Agu' },
  { startCode: 'SEP', labelPair: 'Sep – Okt' },
  { startCode: 'NOV', labelPair: 'Nov – Des' },
];

function generateReferralPayload(referenceDate = new Date()) {
  const jakarta = new Date(referenceDate.getTime() + JAKARTA_OFFSET_MS);
  const year = jakarta.getUTCFullYear();
  const month = jakarta.getUTCMonth() + 1;
  const windowIndex = Math.floor((month - 1) / 2);
  const startMonth = windowIndex * 2 + 1;
  const endMonth = startMonth + 1;
  const lastDayOfEndMonth = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  const validFrom = new Date(Date.UTC(year, startMonth - 1, 1, 0, 0, 0) - JAKARTA_OFFSET_MS);
  const validUntil = new Date(
    Date.UTC(year, endMonth - 1, lastDayOfEndMonth, 23, 59, 59, 999) - JAKARTA_OFFSET_MS,
  );
  const meta = MONTH_WINDOWS[windowIndex];
  const yy = String(year).slice(-2);
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += REFERRAL_ALPHABET[crypto.randomInt(0, REFERRAL_ALPHABET.length)];
  }
  return {
    code: `HMS-${meta.startCode}${yy}-${suffix}`,
    periodLabel: `${meta.labelPair} ${year}`,
    validFrom,
    validUntil,
  };
}

function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[crypto.randomInt(0, chars.length)];
  }
  return out;
}

function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

function nimToEmail(nim: string): string {
  return `${nim.trim()}@anggota.himasri.id`;
}

async function verifyCaller(
  req: VercelRequest,
  adminAuth: ReturnType<typeof getAuth>,
): Promise<DecodedIdToken> {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new RpcError(401, 'functions/unauthenticated', 'Anda harus masuk terlebih dahulu.');
  }
  try {
    return await adminAuth.verifyIdToken(match[1]);
  } catch {
    throw new RpcError(401, 'functions/unauthenticated', 'Sesi login tidak valid. Silakan masuk ulang.');
  }
}

function assertActiveRole(decoded: DecodedIdToken, allowed: Role[]) {
  const role = decoded.role as Role | undefined;
  const status = decoded.status as string | undefined;
  if (status !== 'active' || !role || !allowed.includes(role)) {
    throw new RpcError(403, 'functions/permission-denied', 'Anda tidak memiliki izin untuk aksi ini.');
  }
  return { uid: decoded.uid, role };
}

async function writeAuditLog(
  adminDb: ReturnType<typeof getFirestore>,
  entry: {
    actorUid: string;
    action: string;
    target: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  },
) {
  try {
    await adminDb.collection('auditLogs').add({
      actorUid: entry.actorUid,
      action: entry.action,
      target: entry.target,
      before: entry.before ?? null,
      after: entry.after ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    // Non-blocking audit log
  }
}

async function getCurrentPeriodId(adminDb: ReturnType<typeof getFirestore>): Promise<string> {
  const snap = await adminDb.collection('periods').where('isCurrent', '==', true).limit(1).get();
  return snap.empty ? '' : snap.docs[0].id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'method-not-allowed', message: 'Method not allowed' } });
  }

  try {
    const { adminAuth, adminDb } = initFirebaseAdmin();
    const body = (req.body || {}) as { action?: string; data?: Record<string, unknown> };
    const action = String(body.action || '');
    const data = (body.data || {}) as Record<string, unknown>;

    switch (action) {
      case 'checkReferralCode': {
        const code = normalizeReferralCode(String(data.code || ''));
        if (!code) return res.status(200).json({ data: { valid: false } });
        const snap = await adminDb.doc('secure/referral').get();
        if (!snap.exists) return res.status(200).json({ data: { valid: false } });
        const refData = snap.data() as { code?: string; validUntil?: Timestamp };
        if (
          !refData.code ||
          !refData.validUntil ||
          normalizeReferralCode(refData.code) !== code ||
          Date.now() >= refData.validUntil.toMillis()
        ) {
          return res.status(200).json({ data: { valid: false } });
        }
        return res.status(200).json({
          data: { valid: true, validUntil: refData.validUntil.toDate().toISOString() },
        });
      }

      case 'registerMember': {
        const nama = String(data.nama || '').trim();
        const nim = String(data.nim || '').trim();
        const angkatan = Number(data.angkatan);
        const jurusan = String(data.jurusan || '').trim();
        const password = String(data.password || '');
        const whatsapp = String(data.whatsapp || '').trim();
        const isAslab = Boolean(data.isAslab);
        const referralCode = normalizeReferralCode(String(data.referralCode || ''));

        if (nama.length < 3 || !/^\d{9,12}$/.test(nim) || password.length < 8 || !jurusan || !whatsapp) {
          throw new RpcError(400, 'functions/invalid-argument', 'Data pendaftaran tidak lengkap atau tidak valid.');
        }

        const referralRef = adminDb.doc('secure/referral');
        const nimRef = adminDb.doc(`nimIndex/${nim}`);
        const [referralSnap, nimSnap] = await Promise.all([referralRef.get(), nimRef.get()]);
        const refData = referralSnap.data() as { code?: string; validUntil?: Timestamp } | undefined;

        if (
          !referralSnap.exists ||
          !refData?.code ||
          !refData?.validUntil ||
          normalizeReferralCode(refData.code) !== referralCode ||
          Date.now() >= refData.validUntil.toMillis()
        ) {
          throw new RpcError(
            400,
            'functions/invalid-argument',
            'Kode referal tidak valid atau sudah kedaluwarsa. Minta kode terbaru ke pengurus.',
            { reason: 'invalid-referral' },
          );
        }

        if (nimSnap.exists) {
          throw new RpcError(
            409,
            'functions/already-exists',
            'NIM sudah terdaftar. Silakan masuk atau hubungi admin.',
            { reason: 'nim-exists' },
          );
        }

        let createdUid = '';
        try {
          const userRecord = await adminAuth.createUser({
            email: nimToEmail(nim),
            password,
            displayName: nama,
          });
          createdUid = userRecord.uid;
          await adminAuth.setCustomUserClaims(createdUid, { role: 'anggota', status: 'pending' });
        } catch (err: unknown) {
          if ((err as { code?: string })?.code === 'auth/email-already-exists') {
            throw new RpcError(
              409,
              'functions/already-exists',
              'NIM sudah terdaftar. Silakan masuk atau hubungi admin.',
              { reason: 'nim-exists' },
            );
          }
          throw new RpcError(500, 'functions/internal', 'Gagal membuat akun. Silakan coba lagi.');
        }

        try {
          await adminDb.runTransaction(async (tx) => {
            if ((await tx.get(nimRef)).exists) {
              throw new RpcError(409, 'functions/already-exists', 'NIM sudah terdaftar.', {
                reason: 'nim-exists',
              });
            }
            tx.set(adminDb.doc(`users/${createdUid}`), {
              uid: createdUid,
              nama,
              nim,
              angkatan,
              jurusan,
              whatsapp,
              isAslab,
              fakultas: isAslab ? (data.fakultas ? String(data.fakultas) : null) : null,
              lab: isAslab ? (data.lab ? String(data.lab) : null) : null,
              jadwalAslab: isAslab ? (data.jadwalAslab ? String(data.jadwalAslab) : null) : null,
              requestedPosition: String(data.requestedPosition || 'Anggota'),
              photoURL: null,
              role: 'anggota',
              status: 'pending',
              activePeriods: [],
              referralCodeId: refData.code,
              rejectReason: null,
              claimsUpdatedAt: FieldValue.serverTimestamp(),
              createdAt: FieldValue.serverTimestamp(),
              approvedAt: null,
              approvedBy: null,
            });
            tx.set(nimRef, { uid: createdUid, createdAt: FieldValue.serverTimestamp() });
            tx.update(referralRef, { usedCount: FieldValue.increment(1) });
          });
          return res.status(200).json({ data: { uid: createdUid, status: 'pending' } });
        } catch (err) {
          if (createdUid) await adminAuth.deleteUser(createdUid).catch(() => {});
          throw err;
        }
      }

      case 'approveMember': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin']);
        const uid = String(data.uid || '');
        const role = String(data.role || '') as Role;
        if (!uid || !ALL_ROLES.has(role)) {
          throw new RpcError(400, 'functions/invalid-argument', 'Data persetujuan tidak valid.');
        }
        const userRef = adminDb.doc(`users/${uid}`);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new RpcError(404, 'functions/not-found', 'Pengguna tidak ditemukan.');
        const u = userSnap.data() as Record<string, unknown>;
        const currentPeriodId = await getCurrentPeriodId(adminDb);
        const existingPeriods = Array.isArray(u.activePeriods) ? (u.activePeriods as string[]) : [];
        const nextPeriods = currentPeriodId
          ? Array.from(new Set([...existingPeriods, currentPeriodId]))
          : existingPeriods;

        await adminAuth.setCustomUserClaims(uid, { role, status: 'active' });
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
        batch.set(
          adminDb.doc(`members/${uid}`),
          {
            uid,
            nama: String(u.nama || ''),
            jurusan: String(u.jurusan || ''),
            angkatan: Number(u.angkatan || new Date().getFullYear()),
            isAslab: Boolean(u.isAslab),
            fakultas: u.isAslab ? u.fakultas || null : null,
            lab: u.isAslab ? u.lab || null : null,
            jadwalAslab: u.isAslab ? u.jadwalAslab || null : null,
            whatsappAslab: u.isAslab ? u.whatsapp || null : null,
            photoURL: u.photoURL || null,
            role,
            activePeriods: nextPeriods,
            searchName: String(u.nama || '').trim().toLowerCase(),
          },
          { merge: true },
        );
        await batch.commit();
        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'user:approve',
          target: `users/${uid}`,
          before: { status: 'pending' },
          after: { status: 'active', role, nama: u.nama },
        });
        return res.status(200).json({ data: { ok: true, uid, role, status: 'active' } });
      }

      case 'rejectMember': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin']);
        const uid = String(data.uid || '');
        const reason = data.reason ? String(data.reason).trim() : null;
        if (!uid) throw new RpcError(400, 'functions/invalid-argument', 'ID pengguna wajib diisi.');
        await adminAuth.setCustomUserClaims(uid, { role: 'anggota', status: 'rejected' });
        await adminDb.doc(`users/${uid}`).update({
          status: 'rejected',
          rejectReason: reason,
          claimsUpdatedAt: FieldValue.serverTimestamp(),
        });
        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'user:reject',
          target: `users/${uid}`,
          after: { status: 'rejected', reason },
        });
        return res.status(200).json({ data: { ok: true, uid, status: 'rejected' } });
      }

      case 'updateUserPhoto': {
        const decoded = await verifyCaller(req, adminAuth);
        const photoURL = data.photoURL ? String(data.photoURL) : null;
        await adminAuth.updateUser(decoded.uid, { photoURL: photoURL || undefined });
        const batch = adminDb.batch();
        batch.set(adminDb.doc(`users/${decoded.uid}`), { photoURL }, { merge: true });
        if (decoded.status === 'active') {
          batch.set(adminDb.doc(`members/${decoded.uid}`), { photoURL }, { merge: true });
        }
        await batch.commit();
        return res.status(200).json({ data: { ok: true, photoURL } });
      }

      case 'regenerateReferralCode': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin']);
        const refDoc = adminDb.doc('secure/referral');
        const prevSnap = await refDoc.get();
        const payload = generateReferralPayload(new Date());
        const batch = adminDb.batch();
        if (prevSnap.exists) {
          const prev = prevSnap.data() as Record<string, unknown>;
          batch.set(adminDb.collection('referralHistory').doc(), {
            code: prev.code || '',
            periodLabel: prev.periodLabel || '',
            validFrom: prev.validFrom || FieldValue.serverTimestamp(),
            validUntil: prev.validUntil || FieldValue.serverTimestamp(),
            usedCount: Number(prev.usedCount || 0),
            archivedAt: FieldValue.serverTimestamp(),
            archivedBy: caller.uid,
          });
        }
        batch.set(refDoc, {
          code: payload.code,
          periodLabel: payload.periodLabel,
          validFrom: Timestamp.fromDate(payload.validFrom),
          validUntil: Timestamp.fromDate(payload.validUntil),
          usedCount: 0,
          rotatedAt: FieldValue.serverTimestamp(),
          rotatedBy: caller.uid,
        });
        await batch.commit();
        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'referral:regenerate',
          target: 'secure/referral',
          after: { code: payload.code, periodLabel: payload.periodLabel },
        });
        return res.status(200).json({
          data: {
            code: payload.code,
            periodLabel: payload.periodLabel,
            validFrom: payload.validFrom.toISOString(),
            validUntil: payload.validUntil.toISOString(),
          },
        });
      }

      case 'setUserRole': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin']);
        const uid = String(data.uid || '');
        const role = String(data.role || '') as Role;
        if (!uid || !ALL_ROLES.has(role)) {
          throw new RpcError(400, 'functions/invalid-argument', 'Data perubahan peran tidak valid.');
        }
        const userRef = adminDb.doc(`users/${uid}`);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new RpcError(404, 'functions/not-found', 'Pengguna tidak ditemukan.');
        const status = String(userSnap.data()?.status || 'active');
        await adminAuth.setCustomUserClaims(uid, { role, status });
        const batch = adminDb.batch();
        batch.update(userRef, { role, claimsUpdatedAt: FieldValue.serverTimestamp() });
        if (status === 'active') {
          batch.set(adminDb.doc(`members/${uid}`), { role }, { merge: true });
        }
        await batch.commit();
        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'user:set_role',
          target: `users/${uid}`,
          after: { role },
        });
        return res.status(200).json({ data: { ok: true } });
      }

      case 'setUserStatus': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin']);
        const uid = String(data.uid || '');
        const nextStatus = String(data.status || '') as 'active' | 'disabled';
        if (!uid || (nextStatus !== 'active' && nextStatus !== 'disabled')) {
          throw new RpcError(400, 'functions/invalid-argument', 'Status pengguna tidak valid.');
        }
        if (uid === caller.uid && nextStatus === 'disabled') {
          throw new RpcError(400, 'functions/invalid-argument', 'Anda tidak dapat menonaktifkan akun sendiri.');
        }
        const userRef = adminDb.doc(`users/${uid}`);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new RpcError(404, 'functions/not-found', 'Pengguna tidak ditemukan.');
        const u = userSnap.data() as Record<string, unknown>;
        const role = (u.role as Role) || 'anggota';

        await adminAuth.updateUser(uid, { disabled: nextStatus === 'disabled' });
        await adminAuth.setCustomUserClaims(uid, { role, status: nextStatus });

        const batch = adminDb.batch();
        batch.update(userRef, { status: nextStatus, claimsUpdatedAt: FieldValue.serverTimestamp() });
        if (nextStatus === 'disabled') {
          batch.delete(adminDb.doc(`members/${uid}`));
        } else {
          batch.set(
            adminDb.doc(`members/${uid}`),
            {
              uid,
              nama: String(u.nama || ''),
              jurusan: String(u.jurusan || ''),
              angkatan: Number(u.angkatan || new Date().getFullYear()),
              isAslab: Boolean(u.isAslab),
              fakultas: u.isAslab ? u.fakultas || null : null,
              lab: u.isAslab ? u.lab || null : null,
              jadwalAslab: u.isAslab ? u.jadwalAslab || null : null,
              whatsappAslab: u.isAslab ? u.whatsapp || null : null,
              photoURL: u.photoURL || null,
              role,
              activePeriods: Array.isArray(u.activePeriods) ? u.activePeriods : [],
              searchName: String(u.nama || '').trim().toLowerCase(),
            },
            { merge: true },
          );
        }
        await batch.commit();
        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'user:set_status',
          target: `users/${uid}`,
          after: { status: nextStatus },
        });
        return res.status(200).json({ data: { ok: true } });
      }

      case 'adminResetPassword': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin']);
        const uid = String(data.uid || '');
        if (!uid) throw new RpcError(400, 'functions/invalid-argument', 'ID pengguna wajib diisi.');
        const tempPassword = generateTempPassword(10);
        await adminAuth.updateUser(uid, { password: tempPassword });
        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'user:reset_password',
          target: `users/${uid}`,
        });
        return res.status(200).json({ data: { tempPassword } });
      }

      case 'updateAslab': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin']);
        const uid = String(data.uid || '');
        const isAslab = Boolean(data.isAslab);
        if (!uid) throw new RpcError(400, 'functions/invalid-argument', 'ID pengguna wajib diisi.');
        const userRef = adminDb.doc(`users/${uid}`);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new RpcError(404, 'functions/not-found', 'Pengguna tidak ditemukan.');
        const u = userSnap.data() as Record<string, unknown>;
        const fakultas = isAslab ? (data.fakultas ? String(data.fakultas) : null) : null;
        const lab = isAslab ? (data.lab ? String(data.lab) : null) : null;
        const jadwalAslab = isAslab ? (data.jadwalAslab ? String(data.jadwalAslab) : null) : null;
        const whatsappAslab = isAslab
          ? String(data.whatsappAslab || u.whatsapp || '') || null
          : null;

        const batch = adminDb.batch();
        batch.update(userRef, { isAslab, fakultas, lab, jadwalAslab });
        if (u.status === 'active') {
          batch.set(
            adminDb.doc(`members/${uid}`),
            { isAslab, fakultas, lab, jadwalAslab, whatsappAslab },
            { merge: true },
          );
        }
        await batch.commit();
        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'aslab:update',
          target: `users/${uid}`,
          after: { isAslab, fakultas, lab, jadwalAslab },
        });
        return res.status(200).json({ data: { ok: true } });
      }

      case 'createPeriodWizard': {
        const caller = assertActiveRole(await verifyCaller(req, adminAuth), ['admin', 'inti']);
        const label = String(data.label || '').trim();
        const startYear = Number(data.startYear);
        const copyFromPeriodId = data.copyFromPeriodId ? String(data.copyFromPeriodId) : undefined;
        const archivePrevious = data.archivePrevious !== false;
        const deactivateAngkatan = Array.isArray(data.deactivateAngkatan)
          ? (data.deactivateAngkatan as number[]).map(Number)
          : [];
        const inti = Array.isArray(data.inti) ? data.inti : [];

        if (label.length < 4 || !Number.isInteger(startYear) || inti.length === 0) {
          throw new RpcError(400, 'functions/invalid-argument', 'Input wizard periode baru tidak valid.');
        }
        const newPeriodId = `${startYear}-${startYear + 1}`;
        const newPeriodRef = adminDb.doc(`periods/${newPeriodId}`);
        if ((await newPeriodRef.get()).exists) {
          throw new RpcError(409, 'functions/already-exists', `Periode ${label} sudah ada.`);
        }

        const batch = adminDb.batch();
        if (archivePrevious) {
          const prevCurrent = await adminDb.collection('periods').where('isCurrent', '==', true).get();
          prevCurrent.docs.forEach((d) => {
            batch.update(d.ref, {
              isCurrent: false,
              archived: true,
              updatedAt: FieldValue.serverTimestamp(),
            });
          });
        }

        const copiedHeads: Array<Record<string, string>> = [];
        if (copyFromPeriodId) {
          const prevUnitsSnap = await adminDb.collection(`periods/${copyFromPeriodId}/units`).get();
          prevUnitsSnap.docs.forEach((unitDoc) => {
            const uData = unitDoc.data();
            const cleanLeaders = Array.isArray(uData.leaders)
              ? uData.leaders.map((l: Record<string, unknown>) => {
                  const copy = { ...l };
                  delete copy.photoUrl;
                  delete copy.photoPath;
                  return copy;
                })
              : [];
            const cleanMembers = Array.isArray(uData.members)
              ? uData.members.map((m: Record<string, unknown>) => {
                  const copy = { ...m };
                  delete copy.photoUrl;
                  delete copy.photoPath;
                  return copy;
                })
              : [];
            const cleanData = { ...uData };
            delete cleanData.photoUrl;
            delete cleanData.photoPath;

            batch.set(adminDb.doc(`periods/${newPeriodId}/units/${unitDoc.id}`), {
              ...cleanData,
              leaders: cleanLeaders,
              members: cleanMembers,
              updatedAt: FieldValue.serverTimestamp(),
            });
            const lead = cleanLeaders[0] as Record<string, unknown> | undefined;
            copiedHeads.push({
              kind: String(uData.kind || 'DEPARTEMEN'),
              unit: String(uData.name || unitDoc.id),
              jabatan: String(lead?.jabatan || 'Kepala'),
              nama: String(lead?.nama || 'Belum ditetapkan'),
              jurusan: String(lead?.jurusan || '—'),
              color: String(uData.color || 'maroon-700'),
            });
          });
        }

        batch.set(newPeriodRef, {
          label,
          startYear,
          isCurrent: true,
          archived: false,
          inti,
          heads: copiedHeads,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        const deactivatedUids: string[] = [];
        if (deactivateAngkatan.length > 0 && caller.role === 'admin') {
          const membersSnap = await adminDb.collection('users').where('status', '==', 'active').get();
          for (const userDoc of membersSnap.docs) {
            const u = userDoc.data() as { angkatan?: number; role?: string };
            if (
              u.angkatan &&
              deactivateAngkatan.includes(u.angkatan) &&
              u.role !== 'admin' &&
              userDoc.id !== caller.uid
            ) {
              deactivatedUids.push(userDoc.id);
              batch.update(userDoc.ref, {
                status: 'disabled',
                claimsUpdatedAt: FieldValue.serverTimestamp(),
              });
              batch.delete(adminDb.doc(`members/${userDoc.id}`));
            }
          }
        }

        await batch.commit();

        for (const uid of deactivatedUids) {
          try {
            const rec = await adminAuth.getUser(uid);
            const prevRole = (rec.customClaims?.role as string) || 'anggota';
            await adminAuth.setCustomUserClaims(uid, { role: prevRole, status: 'disabled' });
          } catch {
            // Continue syncing remaining users
          }
        }

        await writeAuditLog(adminDb, {
          actorUid: caller.uid,
          action: 'period:create_wizard',
          target: `periods/${newPeriodId}`,
          after: { label, copiedUnits: copiedHeads.length, deactivatedCount: deactivatedUids.length },
        });

        return res.status(200).json({
          data: {
            ok: true,
            periodId: newPeriodId,
            copiedUnits: copiedHeads.length,
            deactivatedCount: deactivatedUids.length,
          },
        });
      }

      default:
        throw new RpcError(404, 'functions/not-found', `Aksi tidak dikenal: ${action}`);
    }
  } catch (err) {
    if (err instanceof RpcError) {
      return res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
    return res.status(500).json({ error: { code: 'functions/internal', message: msg } });
  }
}
