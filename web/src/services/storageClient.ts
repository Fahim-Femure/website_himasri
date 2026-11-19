import { deleteObject, getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase/client';

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

export async function uploadBlobFile(
  storagePath: string,
  fileOrBlob: Blob | File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<{ url: string; storagePath: string }> {
  if (useEmulators) {
    const storageRef = ref(storage, storagePath);
    if (onProgress) {
      const url = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, fileOrBlob, { contentType });
        task.on(
          'state_changed',
          (snap) => {
            if (snap.totalBytes > 0) {
              onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
            }
          },
          reject,
          async () => {
            try {
              resolve(await getDownloadURL(task.snapshot.ref));
            } catch (err) {
              reject(err);
            }
          },
        );
      });
      return { url, storagePath };
    }
    await uploadBytes(storageRef, fileOrBlob, { contentType });
    const url = await getDownloadURL(storageRef);
    return { url, storagePath };
  }

  if (!auth.currentUser) {
    throw new Error('Anda harus masuk terlebih dahulu untuk mengunggah berkas.');
  }
  const token = await auth.currentUser.getIdToken();
  onProgress?.(20);

  const resp = await fetch('/api/storage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType || 'application/octet-stream',
      'x-storage-path': storagePath,
    },
    body: fileOrBlob,
  });

  const payload = (await resp.json().catch(() => ({}))) as {
    url?: string;
    pathname?: string;
    error?: { message?: string };
  };

  if (!resp.ok || !payload.url) {
    throw new Error(payload.error?.message || 'Gagal mengunggah berkas.');
  }

  onProgress?.(100);
  return { url: payload.url, storagePath: payload.url };
}

export async function deleteBlobFile(pathOrUrl?: string): Promise<void> {
  if (!pathOrUrl) return;
  if (useEmulators) {
    try {
      await deleteObject(ref(storage, pathOrUrl));
    } catch {
      // Ignore if already removed
    }
    return;
  }

  if (!auth.currentUser) return;
  try {
    const token = await auth.currentUser.getIdToken();
    await fetch('/api/storage', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: pathOrUrl }),
    });
  } catch {
    // Non-blocking cleanup
  }
}
