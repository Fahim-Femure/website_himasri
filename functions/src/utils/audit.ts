import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase';

export interface AuditLogInput {
  actorUid: string;
  actorName?: string;
  action: string;
  target: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    let actorName = input.actorName;
    if (!actorName && input.actorUid && input.actorUid !== 'system') {
      const snap = await adminDb.doc(`users/${input.actorUid}`).get();
      if (snap.exists) {
        actorName = (snap.data() as { nama?: string })?.nama;
      }
    }
    await adminDb.collection('auditLogs').add({
      actorUid: input.actorUid,
      actorName: actorName || input.actorUid,
      action: input.action,
      target: input.target,
      before: input.before ?? null,
      after: input.after ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn('[audit] Gagal mencatat audit log:', err);
  }
}
