import { onDocumentDeleted, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { adminDb, adminStorage } from '../utils/firebase';

async function deleteStoragePath(storagePath?: string) {
  if (!storagePath) return;
  try {
    await adminStorage.bucket().file(storagePath).delete({ ignoreNotFound: true });
  } catch (err) {
    console.warn(`[storageTrigger] Gagal menghapus berkas ${storagePath}:`, err);
  }
}

async function syncCourseMaterialCount(courseId?: string) {
  if (!courseId) return;
  const courseRef = adminDb.doc(`courses/${courseId}`);
  const courseSnap = await courseRef.get();
  if (!courseSnap.exists) return;

  const materialsSnap = await adminDb
    .collection('materials')
    .where('courseId', '==', courseId)
    .get();
  await courseRef.update({ materialCount: materialsSnap.size });
}

export const onMaterialWrite = onDocumentWritten(
  {
    document: 'materials/{materialId}',
    region: 'asia-southeast2',
  },
  async (event) => {
    const beforeData = event.data?.before.data() as
      | { courseId?: string; storagePath?: string }
      | undefined;
    const afterData = event.data?.after.data() as
      | { courseId?: string; storagePath?: string }
      | undefined;

    const tasks: Array<Promise<unknown>> = [];

    if (beforeData?.courseId && beforeData.courseId !== afterData?.courseId) {
      tasks.push(syncCourseMaterialCount(beforeData.courseId));
    }
    if (afterData?.courseId) {
      tasks.push(syncCourseMaterialCount(afterData.courseId));
    } else if (beforeData?.courseId) {
      tasks.push(syncCourseMaterialCount(beforeData.courseId));
    }

    if (
      beforeData?.storagePath &&
      (!afterData || beforeData.storagePath !== afterData.storagePath)
    ) {
      tasks.push(deleteStoragePath(beforeData.storagePath));
    }

    await Promise.all(tasks);
  },
);

export const onProductDelete = onDocumentDeleted(
  {
    document: 'products/{productId}',
    region: 'asia-southeast2',
  },
  async (event) => {
    const data = event.data?.data() as { storagePath?: string } | undefined;
    await deleteStoragePath(data?.storagePath);
  },
);

export const onHeroSlideDelete = onDocumentDeleted(
  {
    document: 'heroSlides/{slideId}',
    region: 'asia-southeast2',
  },
  async (event) => {
    const data = event.data?.data() as { storagePath?: string } | undefined;
    await deleteStoragePath(data?.storagePath);
  },
);

export const onJourneyItemDelete = onDocumentDeleted(
  {
    document: 'journeyItems/{itemId}',
    region: 'asia-southeast2',
  },
  async (event) => {
    const data = event.data?.data() as { storagePath?: string } | undefined;
    await deleteStoragePath(data?.storagePath);
  },
);
