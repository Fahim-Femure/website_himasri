import { v1 as firestoreV1 } from '@google-cloud/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

/**
 * Backup mingguan Firestore ke Google Cloud Storage (setiap Minggu pukul 02.00 WIB).
 * Membutuhkan variabel lingkungan BACKUP_BUCKET (mis. gs://himasri-backups) dan izin IAM
 * roles/datastore.importExportAdmin serta roles/storage.objectAdmin pada service account.
 */
export const scheduledFirestoreBackup = onSchedule(
  {
    schedule: '0 2 * * 0',
    timeZone: 'Asia/Jakarta',
    region: 'asia-southeast2',
  },
  async () => {
    const bucket = process.env.BACKUP_BUCKET;
    if (!bucket) {
      console.info('[backup] BACKUP_BUCKET tidak disetel; melewati ekspor terjadwal.');
      return;
    }

    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!projectId) {
      console.warn('[backup] Project ID tidak ditemukan.');
      return;
    }

    const client = new firestoreV1.FirestoreAdminClient();
    const databaseName = client.databasePath(projectId, '(default)');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputUriPrefix = `${bucket.replace(/\/+$/, '')}/firestore-backups/${stamp}`;

    const [operation] = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix,
      collectionIds: [],
    });

    console.info(`[backup] Ekspor Firestore dimulai: ${operation.name} -> ${outputUriPrefix}`);
  },
);
