import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { HeroSettings, HeroSlide, JourneyItemDoc, PeriodDoc, PublicSettings } from '@/types/models';

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  kahimWhatsapp: '',
  wakahimWhatsapp: '',
  adminWhatsapp: '',
  email: 'himasri.official@gmail.com',
  instagram: '@himasri.official',
  alamat: 'Sekretariat HIMASRI, IT PLN',
  isSample: false,
};

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  durationSec: 5,
  transition: 'fade',
  autoplay: true,
  respectReducedMotion: true,
};

export const FALLBACK_JOURNEY_ITEMS: JourneyItemDoc[] = [];

export const FALLBACK_CURRENT_PERIOD: PeriodDoc = {
  id: '',
  label: '',
  isCurrent: true,
  startYear: new Date().getFullYear(),
  inti: [],
  heads: [],
};

export async function fetchPublicSettings(): Promise<PublicSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings/public'));
    if (!snap.exists()) return DEFAULT_PUBLIC_SETTINGS;
    return { ...DEFAULT_PUBLIC_SETTINGS, ...(snap.data() as Partial<PublicSettings>) };
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}

export async function fetchCurrentPeriod(): Promise<PeriodDoc> {
  try {
    const q = query(collection(db, 'periods'), where('isCurrent', '==', true), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...(d.data() as Omit<PeriodDoc, 'id'>) };
    }
    const fallbackSnap = await getDoc(doc(db, 'periods/2025-2026'));
    if (fallbackSnap.exists()) {
      return {
        id: fallbackSnap.id,
        ...(fallbackSnap.data() as Omit<PeriodDoc, 'id'>),
      };
    }
  } catch {
    // Fallback to static copy when offline or emulator empty
  }
  return FALLBACK_CURRENT_PERIOD;
}

export function subscribePublicSettings(onData: (settings: PublicSettings) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'settings/public'),
    (snap) => {
      if (snap.exists()) {
        onData({ ...DEFAULT_PUBLIC_SETTINGS, ...(snap.data() as Partial<PublicSettings>) });
      } else {
        onData(DEFAULT_PUBLIC_SETTINGS);
      }
    },
    () => onData(DEFAULT_PUBLIC_SETTINGS),
  );
}

export function subscribeHeroSettings(onData: (settings: HeroSettings) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'settings/hero'),
    (snap) => {
      if (snap.exists()) {
        onData({ ...DEFAULT_HERO_SETTINGS, ...(snap.data() as Partial<HeroSettings>) });
      } else {
        onData(DEFAULT_HERO_SETTINGS);
      }
    },
    () => onData(DEFAULT_HERO_SETTINGS),
  );
}

export function subscribeActiveHeroSlides(onData: (slides: HeroSlide[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'heroSlides'),
    where('active', '==', true),
    orderBy('order', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: HeroSlide[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HeroSlide, 'id'>),
      }));
      onData(list);
    },
    () => onData([]),
  );
}

export function subscribeActiveJourneyItems(onData: (items: JourneyItemDoc[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'journeyItems'),
    where('active', '==', true),
    orderBy('order', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: JourneyItemDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<JourneyItemDoc, 'id'>),
      }));
      onData(list);
    },
    () => onData([]),
  );
}

export interface JourneyPageResult {
  items: JourneyItemDoc[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export async function fetchActiveJourneyPage(options: {
  pageSize?: number;
  year?: number | null;
  cursor?: QueryDocumentSnapshot | null;
}): Promise<JourneyPageResult> {
  const { pageSize = 6, year = null, cursor = null } = options;
  try {
    const constraints: QueryConstraint[] = [where('active', '==', true)];
    if (typeof year === 'number' && !Number.isNaN(year)) {
      constraints.push(where('year', '==', year));
    }
    constraints.push(orderBy('order', 'asc'));
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
    constraints.push(limit(pageSize));

    const snap = await getDocs(query(collection(db, 'journeyItems'), ...constraints));
    const items: JourneyItemDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<JourneyItemDoc, 'id'>),
    }));

    if (!cursor && items.length === 0 && year === null) {
      return {
        items: FALLBACK_JOURNEY_ITEMS,
        lastDoc: null,
        hasMore: false,
      };
    }

    return {
      items,
      lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === pageSize,
    };
  } catch {
    if (!cursor) {
      const fallback =
        typeof year === 'number'
          ? FALLBACK_JOURNEY_ITEMS.filter((i) => i.year === year)
          : FALLBACK_JOURNEY_ITEMS;
      return { items: fallback, lastDoc: null, hasMore: false };
    }
    return { items: [], lastDoc: null, hasMore: false };
  }
}

export async function fetchAllActiveJourneyItems(
  onBatch?: (items: JourneyItemDoc[]) => void,
): Promise<JourneyItemDoc[]> {
  try {
    const firstSnap = await getDocs(
      query(
        collection(db, 'journeyItems'),
        where('active', '==', true),
        orderBy('order', 'asc'),
        limit(30),
      ),
    );
    const firstBatch: JourneyItemDoc[] = firstSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<JourneyItemDoc, 'id'>),
    }));

    if (firstBatch.length === 0) {
      onBatch?.(FALLBACK_JOURNEY_ITEMS);
      return FALLBACK_JOURNEY_ITEMS;
    }

    onBatch?.(firstBatch);

    if (firstSnap.docs.length < 30) {
      return firstBatch;
    }

    // Load remaining items in background if > 30
    const combined = [...firstBatch];
    let lastDoc: QueryDocumentSnapshot | null = firstSnap.docs[firstSnap.docs.length - 1];
    while (lastDoc) {
      const nextSnap: QuerySnapshot = await getDocs(
        query(
          collection(db, 'journeyItems'),
          where('active', '==', true),
          orderBy('order', 'asc'),
          startAfter(lastDoc),
          limit(30),
        ),
      );
      if (nextSnap.empty) break;
      const more: JourneyItemDoc[] = nextSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<JourneyItemDoc, 'id'>),
      }));
      const seen = new Set(combined.map((i) => i.id));
      for (const item of more) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      }
      onBatch?.(combined);
      lastDoc = nextSnap.docs.length === 30 ? nextSnap.docs[nextSnap.docs.length - 1] : null;
    }
    return combined;
  } catch {
    onBatch?.(FALLBACK_JOURNEY_ITEMS);
    return FALLBACK_JOURNEY_ITEMS;
  }
}

export async function fetchJourneyYearsAndCount(): Promise<{ years: number[]; total: number }> {
  try {
    const q = query(
      collection(db, 'journeyItems'),
      where('active', '==', true),
      orderBy('order', 'asc'),
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      const years = Array.from(new Set(FALLBACK_JOURNEY_ITEMS.map((i) => i.year))).sort(
        (a, b) => a - b,
      );
      return { years, total: FALLBACK_JOURNEY_ITEMS.length };
    }
    const yearSet = new Set<number>();
    snap.docs.forEach((d) => {
      const y = (d.data() as { year?: number }).year;
      if (typeof y === 'number' && !Number.isNaN(y)) yearSet.add(y);
    });
    return {
      years: Array.from(yearSet).sort((a, b) => a - b),
      total: snap.size,
    };
  } catch {
    const years = Array.from(new Set(FALLBACK_JOURNEY_ITEMS.map((i) => i.year))).sort(
      (a, b) => a - b,
    );
    return { years, total: FALLBACK_JOURNEY_ITEMS.length };
  }
}
