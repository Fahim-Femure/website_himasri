import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  ABOUT_COPY,
  AGENDA_COPY,
  BPH_COPY,
  CONTACT_COPY,
  CTA_BAND_COPY,
  CULTURE_COPY,
  DEFAULT_HERO_SLIDES,
  HERO_COPY,
} from '@/content/site';
import { FACULTIES_AND_LABS } from '@/content/labs';
import { auth, db, functions, storage } from '@/lib/firebase/client';
import { compressImageToWebp } from '@/services/memberService';
import { FALLBACK_JOURNEY_ITEMS } from '@/services/publicService';
import type { AgendaDoc, AuditLogDoc, FacultyDoc, HomeContentDoc, IntiOfficer } from '@/types/models';

export const DEFAULT_HOME_CONTENT: HomeContentDoc = {
  hero: { ...HERO_COPY },
  about: {
    title: ABOUT_COPY.title,
    statement: ABOUT_COPY.statement,
    leftLead: ABOUT_COPY.leftLead,
    paragraph: ABOUT_COPY.paragraph,
    pillars: ABOUT_COPY.pillars.map((p) => ({ ...p })),
  },
  culture: {
    title: CULTURE_COPY.title,
    description: CULTURE_COPY.description,
    items: CULTURE_COPY.items.map((c) => ({ ...c })),
  },
  bph: { ...BPH_COPY },
  contact: { ...CONTACT_COPY },
  ctaBand: { ...CTA_BAND_COPY },
};

export const FALLBACK_AGENDA_ITEMS: AgendaDoc[] = AGENDA_COPY.items.map((item, idx) => ({
  id: `fallback-agenda-${idx + 1}`,
  title: item.title,
  tag: item.tag,
  dateLabel: item.tag,
  description: item.description,
  highlight: idx === 0,
  order: idx + 1,
  periodId: '2025-2026',
  active: true,
}));

export const FALLBACK_FACULTIES: FacultyDoc[] = FACULTIES_AND_LABS.map((f, idx) => ({
  id: `faculty-${idx + 1}`,
  name: f.fakultas,
  labs: [...f.labs],
  order: idx + 1,
}));

export async function writeClientAuditLog(
  action: string,
  target: string,
  after?: Record<string, unknown>,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      actorUid: user.uid,
      actorName: user.displayName || user.email || user.uid,
      action,
      target,
      after: after ?? null,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking audit record
  }
}

/* ---------------- B1: Home Content ---------------- */

export function subscribeHomeContentWithMeta(
  onData: (result: { data: HomeContentDoc; exists: boolean }) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'siteContent/home'),
    (snap) => {
      if (!snap.exists()) {
        onData({ data: DEFAULT_HOME_CONTENT, exists: false });
        return;
      }
      const raw = snap.data() as Partial<HomeContentDoc>;
      const defaultCultureById = new Map(
        DEFAULT_HOME_CONTENT.culture.items.map((item) => [item.id, item]),
      );
      const mergedCultureItems = raw.culture?.items?.length
        ? raw.culture.items.map((item) => {
            const def = defaultCultureById.get(item.id);
            return {
              ...item,
              imageUrl: item.imageUrl || def?.imageUrl,
              imageCredit: item.imageCredit ?? def?.imageCredit,
            };
          })
        : DEFAULT_HOME_CONTENT.culture.items;

      onData({
        exists: true,
        data: {
          hero: { ...DEFAULT_HOME_CONTENT.hero, ...(raw.hero ?? {}) },
          about: {
            ...DEFAULT_HOME_CONTENT.about,
            ...(raw.about ?? {}),
            pillars: raw.about?.pillars?.length ? raw.about.pillars : DEFAULT_HOME_CONTENT.about.pillars,
          },
          culture: {
            ...DEFAULT_HOME_CONTENT.culture,
            ...(raw.culture ?? {}),
            items: mergedCultureItems,
          },
          bph: { ...DEFAULT_HOME_CONTENT.bph, ...(raw.bph ?? {}) },
          contact: { ...DEFAULT_HOME_CONTENT.contact, ...(raw.contact ?? {}) },
          ctaBand: { ...DEFAULT_HOME_CONTENT.ctaBand, ...(raw.ctaBand ?? {}) },
          updatedAt: raw.updatedAt,
          updatedBy: raw.updatedBy,
        },
      });
    },
    () => onData({ data: DEFAULT_HOME_CONTENT, exists: false }),
  );
}

export function subscribeHomeContent(onData: (data: HomeContentDoc) => void): Unsubscribe {
  return subscribeHomeContentWithMeta(({ data }) => onData(data));
}

export async function uploadCultureImage(
  itemId: string,
  file: File,
): Promise<{ imageUrl: string; storagePath: string }> {
  const { blob } = await compressImageToWebp(file, { maxWidth: 1600, quality: 0.82 });
  const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, '') || 'budaya';
  const storagePath = `culture/${safeId}-${Date.now()}.webp`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
  const imageUrl = await getDownloadURL(storageRef);
  return { imageUrl, storagePath };
}

export async function deleteCultureStorageImage(storagePath?: string): Promise<void> {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch {
    // Ignore if already removed
  }
}

export const deleteStorageFile = deleteCultureStorageImage;

const MAX_BPH_PHOTO_BYTES = 5 * 1024 * 1024;

function assertValidImageUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Format berkas harus gambar (JPG, PNG, atau WebP).');
  }
  if (file.size > MAX_BPH_PHOTO_BYTES) {
    throw new Error('Ukuran gambar maksimal 5 MB.');
  }
}

export async function compressSquareImageToWebp(
  file: File,
  size = 800,
  quality = 0.84,
): Promise<Blob> {
  assertValidImageUpload(file);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = Math.floor((img.naturalWidth - side) / 2);
    const sy = Math.floor((img.naturalHeight - side) / 2);
    const outSize = Math.min(size, side);
    const canvas = document.createElement('canvas');
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia.');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
    if (!blob) throw new Error('Gagal mengompresi foto ke WebP.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadPeriodDepartmentPhoto(
  periodId: string,
  deptId: string,
  file: File,
): Promise<{ photoUrl: string; photoPath: string }> {
  assertValidImageUpload(file);
  const { blob } = await compressImageToWebp(file, { maxWidth: 1600, quality: 0.84 });
  const safeDept = deptId.replace(/[^a-zA-Z0-9_-]/g, '') || `dept-${Date.now()}`;
  const photoPath = `periods/${periodId}/departments/${safeDept}.webp`;
  const storageRef = ref(storage, photoPath);
  await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
  const photoUrl = await getDownloadURL(storageRef);
  return { photoUrl, photoPath };
}

export async function uploadPeriodPersonPhoto(
  periodId: string,
  personId: string,
  file: File,
): Promise<{ photoUrl: string; photoPath: string }> {
  const blob = await compressSquareImageToWebp(file, 800, 0.84);
  const safePerson = personId.replace(/[^a-zA-Z0-9_-]/g, '') || `person-${Date.now()}`;
  const photoPath = `periods/${periodId}/people/${safePerson}.webp`;
  const storageRef = ref(storage, photoPath);
  await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
  const photoUrl = await getDownloadURL(storageRef);
  return { photoUrl, photoPath };
}

export async function importDefaultHomeContent(): Promise<void> {
  await setDoc(doc(db, 'siteContent/home'), {
    ...DEFAULT_HOME_CONTENT,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || 'unknown',
  });
  await writeClientAuditLog('content:import_default', 'siteContent/home');
}

export async function saveHomeContentSection<K extends keyof HomeContentDoc>(
  section: K,
  value: HomeContentDoc[K],
): Promise<void> {
  await setDoc(
    doc(db, 'siteContent/home'),
    {
      [section]: value,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.uid || 'unknown',
    },
    { merge: true },
  );
  await writeClientAuditLog(`content:update_${String(section)}`, 'siteContent/home');
}

/* ---------------- B2: Agenda ---------------- */

export function subscribeActiveAgenda(
  onData: (items: AgendaDoc[]) => void,
  periodId?: string,
): Unsubscribe {
  const q = query(collection(db, 'agenda'), where('active', '==', true), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AgendaDoc, 'id'>) }));
      const filtered = periodId ? list.filter((i) => !i.periodId || i.periodId === periodId) : list;
      onData(filtered.length > 0 ? filtered : FALLBACK_AGENDA_ITEMS);
    },
    () => onData(FALLBACK_AGENDA_ITEMS),
  );
}

export function subscribeAllAgenda(onData: (items: AgendaDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'agenda'), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AgendaDoc, 'id'>) })));
    },
    () => onData([]),
  );
}

export async function saveAgendaDoc(
  agendaId: string | null,
  data: Omit<AgendaDoc, 'id'>,
): Promise<string> {
  const id = agendaId || `agenda-${Date.now()}`;
  await setDoc(
    doc(db, 'agenda', id),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await writeClientAuditLog(agendaId ? 'agenda:update' : 'agenda:create', `agenda/${id}`, {
    title: data.title,
  });
  return id;
}

export async function deleteAgendaDoc(agendaId: string): Promise<void> {
  await deleteDoc(doc(db, 'agenda', agendaId));
  await writeClientAuditLog('agenda:delete', `agenda/${agendaId}`);
}

export async function reorderAgendaDocs(items: AgendaDoc[]): Promise<void> {
  const batch = writeBatch(db);
  items.forEach((item, idx) => {
    batch.update(doc(db, 'agenda', item.id), { order: idx + 1, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function importFallbackAgenda(): Promise<number> {
  const batch = writeBatch(db);
  FALLBACK_AGENDA_ITEMS.forEach((item, idx) => {
    const id = `agenda-default-${idx + 1}`;
    batch.set(doc(db, 'agenda', id), {
      title: item.title,
      tag: item.tag,
      dateLabel: item.dateLabel || item.tag,
      description: item.description,
      highlight: Boolean(item.highlight),
      order: idx + 1,
      periodId: item.periodId || '2025-2026',
      active: true,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  await writeClientAuditLog('agenda:import_default', 'agenda', { count: FALLBACK_AGENDA_ITEMS.length });
  return FALLBACK_AGENDA_ITEMS.length;
}

export async function importFallbackFaculties(): Promise<number> {
  const batch = writeBatch(db);
  FALLBACK_FACULTIES.forEach((f, idx) => {
    batch.set(doc(db, 'faculties', f.id), {
      name: f.name,
      labs: f.labs,
      order: idx + 1,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  await writeClientAuditLog('faculty:import_default', 'faculties', { count: FALLBACK_FACULTIES.length });
  return FALLBACK_FACULTIES.length;
}

export async function importFallbackJourneyItems(): Promise<number> {
  const batch = writeBatch(db);
  FALLBACK_JOURNEY_ITEMS.forEach((item, idx) => {
    batch.set(doc(db, 'journeyItems', `journey-default-${idx + 1}`), {
      title: item.title,
      description: item.description,
      dateLabel: item.dateLabel,
      year: item.year,
      badge: item.badge || '',
      imageUrl: item.imageUrl,
      storagePath: item.storagePath || '',
      order: idx + 1,
      active: true,
      highlight: idx < 4,
      width: item.width || 1600,
      height: item.height || 1067,
      uploadedBy: auth.currentUser?.uid || 'system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  await writeClientAuditLog('journey:import_default', 'journeyItems', { count: FALLBACK_JOURNEY_ITEMS.length });
  return FALLBACK_JOURNEY_ITEMS.length;
}

export async function importDefaultHeroSlides(): Promise<number> {
  const batch = writeBatch(db);
  DEFAULT_HERO_SLIDES.forEach((slide, idx) => {
    batch.set(doc(db, 'heroSlides', `hero-default-${idx + 1}`), {
      imageUrl: slide.imageUrl,
      storagePath: slide.storagePath || '',
      caption: slide.caption,
      order: idx + 1,
      active: true,
      width: slide.width,
      height: slide.height,
      focalY: slide.focalY,
      uploadedBy: auth.currentUser?.uid || 'system',
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
  await writeClientAuditLog('hero:import_default', 'heroSlides', { count: DEFAULT_HERO_SLIDES.length });
  return DEFAULT_HERO_SLIDES.length;
}

export function subscribeAllFacultiesRaw(onData: (items: FacultyDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'faculties'), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FacultyDoc, 'id'>) })));
    },
    () => onData([]),
  );
}

/* ---------------- B3: Faculties & Labs ---------------- */

export function subscribeFaculties(onData: (items: FacultyDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'faculties'), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FacultyDoc, 'id'>) }));
      onData(list.length > 0 ? list : FALLBACK_FACULTIES);
    },
    () => onData(FALLBACK_FACULTIES),
  );
}

export async function saveFacultyDoc(
  facultyId: string | null,
  data: Omit<FacultyDoc, 'id'>,
): Promise<string> {
  const id =
    facultyId ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') ||
    `faculty-${Date.now()}`;

  await setDoc(
    doc(db, 'faculties', id),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await writeClientAuditLog(facultyId ? 'faculty:update' : 'faculty:create', `faculties/${id}`, {
    name: data.name,
    labCount: data.labs.length,
  });
  return id;
}

export async function deleteFacultyDoc(facultyId: string): Promise<void> {
  await deleteDoc(doc(db, 'faculties', facultyId));
  await writeClientAuditLog('faculty:delete', `faculties/${facultyId}`);
}

/* ---------------- B4: Update Aslab Callable ---------------- */

export async function callUpdateAslab(payload: {
  uid: string;
  isAslab: boolean;
  fakultas?: string;
  lab?: string;
  jadwalAslab?: string;
  whatsappAslab?: string;
}): Promise<{ ok: boolean }> {
  const fn = httpsCallable<typeof payload, { ok: boolean }>(functions, 'updateAslab');
  const res = await fn(payload);
  return res.data;
}

/* ---------------- B5: Create Period Wizard Callable ---------------- */

export async function callCreatePeriodWizard(payload: {
  label: string;
  startYear: number;
  copyFromPeriodId?: string;
  archivePrevious: boolean;
  deactivateAngkatan: number[];
  inti: IntiOfficer[];
}): Promise<{ ok: boolean; periodId: string; copiedUnits: number; deactivatedCount: number }> {
  const fn = httpsCallable<
    typeof payload,
    { ok: boolean; periodId: string; copiedUnits: number; deactivatedCount: number }
  >(functions, 'createPeriodWizard');
  const res = await fn(payload);
  return res.data;
}

/* ---------------- C1: Pending Users Count Badge ---------------- */

export function subscribePendingUsersCount(onCount: (count: number) => void): Unsubscribe {
  const q = query(collection(db, 'users'), where('status', '==', 'pending'));
  return onSnapshot(
    q,
    (snap) => onCount(snap.size),
    () => onCount(0),
  );
}

/* ---------------- C3: Audit Logs ---------------- */

export function subscribeAuditLogs(onData: (logs: AuditLogDoc[]) => void): Unsubscribe {
  const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLogDoc, 'id'>) })));
    },
    () => onData([]),
  );
}
