import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { adminAuth, adminDb } from '../utils/firebase';

const intiSchema = z.object({
  position: z.string().min(1).max(80),
  nama: z.string().min(1).max(100),
  jurusan: z.string().max(100).default('—'),
});

const createPeriodWizardSchema = z.object({
  label: z.string().trim().min(4).max(40),
  startYear: z.number().int().min(2020).max(2100),
  copyFromPeriodId: z.string().optional(),
  archivePrevious: z.boolean().default(true),
  deactivateAngkatan: z.array(z.number().int().min(2010).max(2100)).default([]),
  inti: z.array(intiSchema).min(1).max(12),
});

export const createPeriodWizard = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin', 'inti']);
  const parsed = createPeriodWizardSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Input wizard periode baru tidak valid.');
  }

  const { label, startYear, copyFromPeriodId, archivePrevious, deactivateAngkatan, inti } =
    parsed.data;
  const newPeriodId = `${startYear}-${startYear + 1}`;
  const newPeriodRef = adminDb.doc(`periods/${newPeriodId}`);
  const existingSnap = await newPeriodRef.get();
  if (existingSnap.exists) {
    throw new HttpsError('already-exists', `Periode ${label} sudah ada.`);
  }

  const batch = adminDb.batch();

  // 1. Archive / unset isCurrent on previous periods
  if (archivePrevious) {
    const allPeriods = await adminDb.collection('periods').where('isCurrent', '==', true).get();
    allPeriods.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isCurrent: false,
        archived: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  // 2. Optionally copy units from previous period
  const copiedHeads: Array<{
    kind: string;
    unit: string;
    jabatan: string;
    nama: string;
    jurusan: string;
    color: string;
  }> = [];

  if (copyFromPeriodId) {
    const prevUnitsSnap = await adminDb.collection(`periods/${copyFromPeriodId}/units`).get();
    prevUnitsSnap.docs.forEach((unitDoc) => {
      const data = unitDoc.data();
      // Do NOT copy photos from previous period
      const cleanLeaders = Array.isArray(data.leaders)
        ? data.leaders.map((l: Record<string, unknown>) => {
            const copy = { ...l };
            delete copy.photoUrl;
            delete copy.photoPath;
            return copy;
          })
        : [];
      const cleanMembers = Array.isArray(data.members)
        ? data.members.map((m: Record<string, unknown>) => {
            const copy = { ...m };
            delete copy.photoUrl;
            delete copy.photoPath;
            return copy;
          })
        : [];
      const cleanData = { ...data };
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
        kind: String(data.kind || 'DEPARTEMEN'),
        unit: String(data.name || unitDoc.id),
        jabatan: String(lead?.jabatan || 'Kepala'),
        nama: String(lead?.nama || 'Belum ditetapkan'),
        jurusan: String(lead?.jurusan || '—'),
        color: String(data.color || 'maroon-700'),
      });
    });
  }

  // 3. Create new period document
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

  // 4. Optional batch deactivation of graduated angkatan (non-admin only)
  const deactivatedUids: string[] = [];
  if (deactivateAngkatan.length > 0 && caller.role === 'admin') {
    const membersSnap = await adminDb
      .collection('users')
      .where('status', '==', 'active')
      .get();

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

  // Sync Auth claims for deactivated users
  for (const uid of deactivatedUids) {
    try {
      const rec = await adminAuth.getUser(uid);
      const prevRole = (rec.customClaims?.role as string) || 'anggota';
      await adminAuth.setCustomUserClaims(uid, { role: prevRole, status: 'disabled' });
    } catch (err) {
      console.warn(`[createPeriodWizard] Gagal update claims untuk ${uid}:`, err);
    }
  }

  await writeAuditLog({
    actorUid: caller.uid,
    action: 'period:create_wizard',
    target: `periods/${newPeriodId}`,
    after: {
      label,
      copiedUnits: copiedHeads.length,
      archivePrevious,
      deactivatedCount: deactivatedUids.length,
      deactivateAngkatan,
    },
  });

  return {
    ok: true,
    periodId: newPeriodId,
    copiedUnits: copiedHeads.length,
    deactivatedCount: deactivatedUids.length,
  };
});
