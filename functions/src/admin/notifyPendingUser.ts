import { FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { adminDb } from '../utils/firebase';

/**
 * Trigger ketika pendaftar baru berstatus 'pending' dibuat di users/{uid}.
 * Menulis dokumen ke koleksi `mail` (kompatibel dengan Firebase Trigger Email extension)
 * untuk mengirim notifikasi email ke admin HIMASRI.
 */
export const notifyPendingUser = onDocumentCreated(
  {
    document: 'users/{uid}',
    region: 'asia-southeast2',
  },
  async (event) => {
    const data = event.data?.data() as
      | {
          nama?: string;
          nim?: string;
          jurusan?: string;
          angkatan?: number;
          status?: string;
        }
      | undefined;

    if (!data || data.status !== 'pending') return;

    const notifyTo = process.env.ADMIN_NOTIFY_EMAIL || '';
    const recipients: string[] = [];

    if (notifyTo) {
      recipients.push(
        ...notifyTo
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      );
    } else {
      const publicSnap = await adminDb.doc('settings/public').get();
      const pubEmail = (publicSnap.data() as { email?: string } | undefined)?.email;
      if (pubEmail) recipients.push(pubEmail);
    }

    if (recipients.length === 0) return;

    await adminDb.collection('mail').add({
      to: recipients,
      message: {
        subject: `[HIMASRI] Pendaftar Baru Menunggu Verifikasi: ${data.nama || data.nim}`,
        text: `Pendaftar baru menunggu verifikasi admin.\nNama: ${data.nama || '—'}\nNIM: ${data.nim || '—'}\nJurusan: ${data.jurusan || '—'}\nAngkatan: ${data.angkatan || '—'}\n\nBuka panel Pengguna & Hak Akses untuk menyetujui atau menolak.`,
      },
      createdAt: FieldValue.serverTimestamp(),
    });
  },
);
