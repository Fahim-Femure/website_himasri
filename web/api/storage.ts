import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del, put } from '@vercel/blob';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

function initAdminAuth() {
  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT belum dikonfigurasi di server.');
    }
    const trimmed = raw.trim();
    const jsonStr = trimmed.startsWith('{')
      ? trimmed
      : Buffer.from(trimmed.replace(/\s+/g, ''), 'base64').toString('utf8');
    const serviceAccount = JSON.parse(jsonStr);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }
  return getAuth();
}

async function verifyUser(req: VercelRequest): Promise<DecodedIdToken> {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error('UNAUTHORIZED');
  }
  const auth = initAdminAuth();
  return auth.verifyIdToken(match[1]);
}

function canWritePath(decoded: DecodedIdToken, storagePath: string, contentType: string): boolean {
  const role = String(decoded.role || '');
  const status = String(decoded.status || '');
  const isImage = contentType.startsWith('image/');

  if (/^avatars\/([^/]+)\//.test(storagePath)) {
    const ownerUid = storagePath.split('/')[1];
    return (decoded.uid === ownerUid || (status === 'active' && role === 'admin')) && isImage;
  }

  if (status !== 'active') return false;

  if (/^(hero|journey|products|culture)\//.test(storagePath)) {
    return ['kominfo', 'inti', 'admin'].includes(role) && isImage;
  }
  if (/^periods\/[^/]+\/(departments|people)\//.test(storagePath)) {
    return ['inti', 'admin'].includes(role) && isImage;
  }
  if (/^materials\//.test(storagePath)) {
    return ['akademik', 'inti', 'admin'].includes(role);
  }
  return false;
}

async function readRawBody(req: VercelRequest, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw new Error('FILE_TOO_LARGE');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const decoded = await verifyUser(req);

    if (req.method === 'POST') {
      const storagePath = String(req.headers['x-storage-path'] || '').replace(/^\/+/, '');
      const contentType = String(req.headers['content-type'] || 'application/octet-stream');
      if (!storagePath || storagePath.includes('..')) {
        return res.status(400).json({ error: { message: 'Path berkas tidak valid.' } });
      }
      if (!canWritePath(decoded, storagePath, contentType)) {
        return res.status(403).json({ error: { message: 'Anda tidak memiliki izin mengunggah ke lokasi ini.' } });
      }

      const maxBytes = 4.5 * 1024 * 1024; // Batas payload aman Vercel Hobby (4.5 MB)
      const bodyBuffer = await readRawBody(req, maxBytes);
      const blob = await put(storagePath, bodyBuffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      return res.status(200).json({
        url: blob.url,
        pathname: blob.pathname,
      });
    }

    if (req.method === 'DELETE') {
      const rawBody = await readRawBody(req, 64 * 1024);
      const parsed = JSON.parse(rawBody.toString('utf8') || '{}') as { url?: string; path?: string };
      const target = parsed.url || parsed.path || '';
      if (!target) return res.status(200).json({ ok: true });

      const role = String(decoded.role || '');
      const status = String(decoded.status || '');
      const isAllowed =
        status === 'active' && ['admin', 'inti', 'kominfo', 'akademik'].includes(role);
      if (!isAllowed) {
        return res.status(403).json({ error: { message: 'Tidak diizinkan menghapus berkas.' } });
      }

      if (target.startsWith('http://') || target.startsWith('https://')) {
        await del(target).catch(() => {});
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: { message: 'Method not allowed' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses berkas.';
    if (msg === 'UNAUTHORIZED') {
      return res.status(401).json({ error: { message: 'Silakan masuk terlebih dahulu.' } });
    }
    if (msg === 'FILE_TOO_LARGE') {
      return res.status(413).json({ error: { message: 'Ukuran berkas melebihi batas 4,5 MB.' } });
    }
    return res.status(500).json({ error: { message: msg } });
  }
}
