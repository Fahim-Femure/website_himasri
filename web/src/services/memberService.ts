import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { callBackendRpc } from '@/services/rpcClient';
import { uploadBlobFile } from '@/services/storageClient';
import type {
  CourseDoc,
  EventDoc,
  HeroSettings,
  HeroSlide,
  JourneyItemDoc,
  MaterialDoc,
  MemberDoc,
  PeriodDoc,
  ProductDoc,
  PublicSettings,
  ReferralDoc,
  ReferralHistoryDoc,
  Role,
  UnitDoc,
  UserDoc,
} from '@/types/models';

export interface CompressedWebpResult {
  blob: Blob;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export async function compressImageToWebp(
  file: File,
  options: { maxWidth: number; aspectRatio?: number; quality?: number },
): Promise<CompressedWebpResult> {
  const { maxWidth, aspectRatio, quality = 0.85 } = options;
  const imgUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      image.src = imgUrl;
    });

    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    let sx = 0;
    let sy = 0;
    let sWidth = origW;
    let sHeight = origH;

    if (aspectRatio) {
      const currentRatio = origW / origH;
      if (currentRatio > aspectRatio) {
        sWidth = Math.round(origH * aspectRatio);
        sx = Math.round((origW - sWidth) / 2);
      } else {
        sHeight = Math.round(origW / aspectRatio);
        sy = Math.round((origH - sHeight) / 2);
      }
    }

    const outW = Math.min(maxWidth, sWidth);
    const outH = aspectRatio
      ? Math.round(outW / aspectRatio)
      : Math.round((outW / sWidth) * sHeight);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, outW);
    canvas.height = Math.max(1, outH);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung pemrosesan gambar.');
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) reject(new Error('Gagal mengompresi gambar ke WebP.'));
          else resolve(result);
        },
        'image/webp',
        quality,
      );
    });

    return {
      blob,
      width: canvas.width,
      height: canvas.height,
      originalWidth: origW,
      originalHeight: origH,
    };
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

export async function uploadBlobWithProgress(
  storagePath: string,
  fileOrBlob: Blob | File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { url } = await uploadBlobFile(storagePath, fileOrBlob, contentType, onProgress);
  return url;
}

// ---------- Periods & BPH ----------
export async function fetchAllPeriods(): Promise<PeriodDoc[]> {
  const snap = await getDocs(query(collection(db, 'periods'), orderBy('startYear', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PeriodDoc, 'id'>) }));
}

export async function fetchUnitsForPeriod(periodId: string): Promise<UnitDoc[]> {
  const snap = await getDocs(
    query(collection(db, `periods/${periodId}/units`), orderBy('order', 'asc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UnitDoc, 'id'>) }));
}

export async function savePeriodDoc(
  periodId: string,
  payload: Omit<PeriodDoc, 'id'>,
  setAsCurrent?: boolean,
) {
  const batch = writeBatch(db);
  if (setAsCurrent) {
    const existing = await getDocs(collection(db, 'periods'));
    existing.docs.forEach((d) => {
      if (d.id !== periodId && d.data().isCurrent) {
        batch.update(d.ref, { isCurrent: false });
      }
    });
  }
  batch.set(
    doc(db, `periods/${periodId}`),
    { ...payload, isCurrent: setAsCurrent ?? payload.isCurrent, updatedAt: serverTimestamp() },
    { merge: true },
  );
  await batch.commit();
}

export async function saveUnitDoc(periodId: string, unitId: string, unit: Omit<UnitDoc, 'id'>) {
  await setDoc(doc(db, `periods/${periodId}/units/${unitId}`), unit, { merge: true });
}

export async function deleteUnitDoc(periodId: string, unitId: string) {
  await deleteDoc(doc(db, `periods/${periodId}/units/${unitId}`));
}

export async function savePublicSettings(settings: PublicSettings) {
  await setDoc(
    doc(db, 'settings/public'),
    { ...settings, isSample: false },
    { merge: true },
  );
}

// ---------- Members ----------
export async function fetchMembers(): Promise<MemberDoc[]> {
  const snap = await getDocs(query(collection(db, 'members'), orderBy('searchName', 'asc')));
  return snap.docs.map((d) => ({ ...(d.data() as MemberDoc), uid: d.id }));
}

export function subscribeMembers(onData: (members: MemberDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'members'), orderBy('searchName', 'asc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ ...(d.data() as MemberDoc), uid: d.id })));
  });
}

// ---------- Courses & Materials ----------
export function subscribeCourses(onData: (courses: CourseDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'courses'), orderBy('semester', 'asc'), orderBy('name', 'asc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CourseDoc, 'id'>) })));
  });
}

export function subscribeMaterialsByCourse(
  courseId: string,
  onData: (materials: MaterialDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'materials'),
    where('courseId', '==', courseId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MaterialDoc, 'id'>) })));
  });
}

export async function createCourse(payload: {
  jurusan: string;
  name: string;
  semester: number;
  createdBy: string;
}) {
  return addDoc(collection(db, 'courses'), {
    ...payload,
    materialCount: 0,
    isSample: false,
    createdAt: serverTimestamp(),
  });
}

export async function saveMaterial(
  id: string | null,
  payload: Omit<MaterialDoc, 'id' | 'createdAt' | 'updatedAt'>,
) {
  if (id) {
    await updateDoc(doc(db, `materials/${id}`), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    return id;
  }
  const refDoc = doc(collection(db, 'materials'));
  const batch = writeBatch(db);
  batch.set(refDoc, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, `courses/${payload.courseId}`), {
    materialCount: increment(1),
  });
  await batch.commit();
  return refDoc.id;
}

export async function deleteMaterial(id: string, courseId?: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, `materials/${id}`));
  if (courseId) {
    batch.update(doc(db, `courses/${courseId}`), {
      materialCount: increment(-1),
    });
  }
  await batch.commit();
}

// ---------- Events & Products ----------
export function subscribeEvents(onData: (events: EventDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'events'), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) })));
  });
}

export function subscribePublishedProducts(onData: (products: ProductDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'products'), where('status', '==', 'published'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductDoc, 'id'>) }));
    onData(items);
  });
}

export function subscribeAllProducts(onData: (products: ProductDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductDoc, 'id'>) })));
  });
}

export function subscribeProductClickCounts(
  onData: (counts: Record<string, number>, total: number) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'productClicks'), (snap) => {
    const counts: Record<string, number> = {};
    snap.docs.forEach((d) => {
      const pid = d.data().productId as string | undefined;
      if (pid) {
        counts[pid] = (counts[pid] ?? 0) + 1;
      }
    });
    onData(counts, snap.size);
  });
}

export async function recordProductClick(productId: string, uid: string) {
  await addDoc(collection(db, 'productClicks'), {
    productId,
    uid,
    createdAt: serverTimestamp(),
  });
}

export async function saveEventDoc(id: string | null, payload: Omit<EventDoc, 'id'>) {
  if (id) {
    await setDoc(doc(db, `events/${id}`), { ...payload, isSample: false }, { merge: true });
    return id;
  }
  const refDoc = await addDoc(collection(db, 'events'), { ...payload, isSample: false });
  return refDoc.id;
}

export async function saveProductDoc(
  id: string,
  payload: Omit<ProductDoc, 'id' | 'createdAt' | 'updatedAt'>,
  isNew: boolean,
) {
  const data = {
    ...payload,
    isSample: false,
    updatedAt: serverTimestamp(),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
  };
  await setDoc(doc(db, `products/${id}`), data, { merge: true });
}

export async function deleteProductDoc(id: string) {
  await deleteDoc(doc(db, `products/${id}`));
}

// ---------- Hero Slides & Settings ----------
export function subscribeAllHeroSlides(onData: (slides: HeroSlide[]) => void): Unsubscribe {
  const q = query(collection(db, 'heroSlides'), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HeroSlide, 'id'>) })));
  });
}

export async function saveHeroSettings(settings: HeroSettings) {
  await setDoc(doc(db, 'settings/hero'), settings, { merge: true });
}

export async function createHeroSlideDoc(
  id: string,
  payload: Omit<HeroSlide, 'id' | 'createdAt'>,
) {
  await setDoc(doc(db, `heroSlides/${id}`), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function updateHeroSlideDoc(id: string, partial: Partial<HeroSlide>) {
  await updateDoc(doc(db, `heroSlides/${id}`), partial);
}

export async function reorderHeroSlides(slides: HeroSlide[]) {
  const batch = writeBatch(db);
  slides.forEach((slide, idx) => {
    batch.update(doc(db, `heroSlides/${slide.id}`), { order: idx + 1 });
  });
  await batch.commit();
}

export async function deleteHeroSlideDoc(id: string) {
  await deleteDoc(doc(db, `heroSlides/${id}`));
}

// ---------- Journey Timeline Items ----------
export function subscribeAllJourneyItems(onData: (items: JourneyItemDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'journeyItems'), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JourneyItemDoc, 'id'>) })));
  });
}

export async function createJourneyItemDoc(
  id: string,
  payload: Omit<JourneyItemDoc, 'id' | 'createdAt' | 'updatedAt'>,
) {
  await setDoc(doc(db, `journeyItems/${id}`), {
    ...payload,
    isSample: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateJourneyItemDoc(id: string, partial: Partial<JourneyItemDoc>) {
  await updateDoc(doc(db, `journeyItems/${id}`), {
    ...partial,
    isSample: false,
    updatedAt: serverTimestamp(),
  });
}

export async function reorderJourneyItems(items: JourneyItemDoc[]) {
  const batch = writeBatch(db);
  items.forEach((item, idx) => {
    batch.update(doc(db, `journeyItems/${item.id}`), { order: idx + 1 });
  });
  await batch.commit();
}

export async function deleteJourneyItemDoc(id: string) {
  await deleteDoc(doc(db, `journeyItems/${id}`));
}

// ---------- Referral (Inti & Admin) ----------
export function subscribeActiveReferral(onData: (docData: ReferralDoc | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'secure/referral'), (snap) => {
    if (snap.exists()) {
      onData(snap.data() as ReferralDoc);
    } else {
      onData(null);
    }
  });
}

export function subscribeReferralHistory(
  onData: (items: ReferralHistoryDoc[]) => void,
): Unsubscribe {
  const q = query(collection(db, 'referralHistory'), orderBy('validUntil', 'desc'));
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReferralHistoryDoc, 'id'>) })),
    );
  });
}

export async function callRegenerateReferralCode() {
  return callBackendRpc<undefined, { code: string; periodLabel: string }>('regenerateReferralCode');
}

// ---------- Users & Roles (Admin) ----------
export function subscribeAllUsers(onData: (users: UserDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserDoc, 'uid'>) })));
  });
}

export async function callApproveMember(uid: string, role: Role) {
  return callBackendRpc<{ uid: string; role: Role }, { ok: boolean }>('approveMember', { uid, role });
}

export async function callRejectMember(uid: string, reason?: string) {
  return callBackendRpc<{ uid: string; reason?: string }, { ok: boolean }>('rejectMember', { uid, reason });
}

export async function callSetUserRole(uid: string, role: Role) {
  return callBackendRpc<{ uid: string; role: Role }, { ok: boolean }>('setUserRole', { uid, role });
}

export async function callSetUserStatus(uid: string, status: 'active' | 'disabled') {
  return callBackendRpc<{ uid: string; status: 'active' | 'disabled' }, { ok: boolean }>(
    'setUserStatus',
    { uid, status },
  );
}

export async function callAdminResetPassword(uid: string): Promise<{ tempPassword: string }> {
  return callBackendRpc<{ uid: string }, { tempPassword: string }>('adminResetPassword', { uid });
}
