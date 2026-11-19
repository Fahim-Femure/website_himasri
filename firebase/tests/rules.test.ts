import fs from 'node:fs';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-himasri';

let testEnv: RulesTestEnvironment;

function ctxUnauth() {
  return testEnv.unauthenticatedContext();
}

function ctxRole(uid: string, role: string, status: 'active' | 'pending' | 'disabled' = 'active') {
  return testEnv.authenticatedContext(uid, { role, status });
}

describe('Security Rules HIMASRI (Firestore & Storage)', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync(path.resolve(process.cwd(), 'firebase/firestore.rules'), 'utf8'),
      },
      storage: {
        host: '127.0.0.1',
        port: 9199,
        rules: fs.readFileSync(path.resolve(process.cwd(), 'firebase/storage.rules'), 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users/u-anggota'), { nama: 'Anggota', nim: '202431001', role: 'anggota', status: 'active' });
      await setDoc(doc(db, 'users/u-pending'), { nama: 'Pending', nim: '202531001', role: 'anggota', status: 'pending' });
      await setDoc(doc(db, 'members/u-anggota'), { nama: 'Anggota', role: 'anggota', activePeriods: ['2025-2026'] });
      await setDoc(doc(db, 'nimIndex/202431001'), { uid: 'u-anggota' });
      await setDoc(doc(db, 'rateLimits/abc'), { count: 1 });
      await setDoc(doc(db, 'periods/2025-2026'), { label: '2025/2026', isCurrent: true });
      await setDoc(doc(db, 'periods/2025-2026/units/psdm'), { name: 'PSDM', kind: 'DEPARTEMEN' });
      await setDoc(doc(db, 'settings/public'), { kahimWhatsapp: '6281234567801' });
      await setDoc(doc(db, 'settings/hero'), { durationSec: 5, transition: 'fade', autoplay: true });
      await setDoc(doc(db, 'heroSlides/s-active'), { active: true, order: 1, caption: 'Aktif' });
      await setDoc(doc(db, 'heroSlides/s-inactive'), { active: false, order: 2, caption: 'Nonaktif' });
      await setDoc(doc(db, 'journeyItems/j-active'), {
        title: 'Momen Publik',
        dateLabel: 'Oktober 2025',
        year: 2025,
        active: true,
        order: 1,
      });
      await setDoc(doc(db, 'journeyItems/j-inactive'), {
        title: 'Draf Tersembunyi',
        dateLabel: 'November 2025',
        year: 2025,
        active: false,
        order: 2,
      });
      await setDoc(doc(db, 'secure/referral'), { code: 'HMS-NOV26-7K4M' });
      await setDoc(doc(db, 'referralHistory/h1'), { code: 'HMS-SEP26-ABCD' });
      await setDoc(doc(db, 'courses/c1'), { jurusan: 'S1 Teknik Informatika', name: 'Algoritma', semester: 1 });
      await setDoc(doc(db, 'materials/m1'), { courseId: 'c1', title: 'Modul 1', type: 'link', semester: 1 });
      await setDoc(doc(db, 'events/e1'), { name: 'HUT 2026', contactWhatsapp: '6281234567803' });
      await setDoc(doc(db, 'products/p-pub'), { name: 'Kaos', price: 95000, stock: 10, status: 'published' });
      await setDoc(doc(db, 'products/p-draft'), { name: 'Topi', price: 55000, stock: 5, status: 'draft' });
    });
  });

  describe('users/{uid}', () => {
    it('menolak tamu membaca atau menulis users', async () => {
      const db = ctxUnauth().firestore();
      await assertFails(getDoc(doc(db, 'users/u-anggota')));
      await assertFails(setDoc(doc(db, 'users/u-new'), { nama: 'Hacker' }));
    });

    it('mengizinkan pemilik & admin membaca, tetapi menolak semua penulisan klien', async () => {
      const ownerDb = ctxRole('u-anggota', 'anggota').firestore();
      const otherDb = ctxRole('u-other', 'anggota').firestore();
      const adminDb = ctxRole('u-admin', 'admin').firestore();

      await assertSucceeds(getDoc(doc(ownerDb, 'users/u-anggota')));
      await assertFails(getDoc(doc(otherDb, 'users/u-anggota')));
      await assertSucceeds(getDoc(doc(adminDb, 'users/u-anggota')));
      await assertFails(updateDoc(doc(ownerDb, 'users/u-anggota'), { role: 'admin' }));
      await assertFails(updateDoc(doc(adminDb, 'users/u-anggota'), { role: 'admin' }));
    });
  });

  describe('members/{uid}, nimIndex, rateLimits', () => {
    it('menolak tamu dan pending membaca members; mengizinkan anggota aktif', async () => {
      await assertFails(getDoc(doc(ctxUnauth().firestore(), 'members/u-anggota')));
      await assertFails(getDoc(doc(ctxRole('u-pending', 'anggota', 'pending').firestore(), 'members/u-anggota')));
      await assertSucceeds(getDoc(doc(ctxRole('u-anggota', 'anggota').firestore(), 'members/u-anggota')));
      await assertFails(setDoc(doc(ctxRole('u-admin', 'admin').firestore(), 'members/x'), { nama: 'X' }));
    });

    it('menolak seluruh akses klien ke nimIndex dan rateLimits', async () => {
      const adminDb = ctxRole('u-admin', 'admin').firestore();
      await assertFails(getDoc(doc(adminDb, 'nimIndex/202431001')));
      await assertFails(getDoc(doc(adminDb, 'rateLimits/abc')));
      await assertFails(setDoc(doc(adminDb, 'nimIndex/999999999'), { uid: 'x' }));
    });
  });

  describe('periods & units & settings', () => {
    it('mengizinkan tamu membaca periods & settings publik, tapi menolak membaca units', async () => {
      const guestDb = ctxUnauth().firestore();
      await assertSucceeds(getDoc(doc(guestDb, 'periods/2025-2026')));
      await assertSucceeds(getDoc(doc(guestDb, 'settings/public')));
      await assertSucceeds(getDoc(doc(guestDb, 'settings/hero')));
      await assertFails(getDoc(doc(guestDb, 'periods/2025-2026/units/psdm')));
    });

    it('mengizinkan anggota membaca units, hanya inti/admin yang boleh menulis periods & units', async () => {
      const anggotaDb = ctxRole('u-a', 'anggota').firestore();
      const kominfoDb = ctxRole('u-k', 'kominfo').firestore();
      const intiDb = ctxRole('u-i', 'inti').firestore();
      const adminDb = ctxRole('u-ad', 'admin').firestore();

      await assertSucceeds(getDoc(doc(anggotaDb, 'periods/2025-2026/units/psdm')));
      await assertFails(setDoc(doc(kominfoDb, 'periods/2025-2026'), { label: 'ubah' }, { merge: true }));
      await assertSucceeds(setDoc(doc(intiDb, 'periods/2025-2026'), { label: '2025/2026' }, { merge: true }));
      await assertSucceeds(setDoc(doc(adminDb, 'periods/2025-2026/units/psdm'), { name: 'PSDM' }, { merge: true }));
      await assertSucceeds(setDoc(doc(intiDb, 'settings/public'), { email: 'a@b.id' }, { merge: true }));
    });
  });

  describe('heroSlides & settings/hero', () => {
    it('tamu hanya boleh membaca slide aktif; kominfo/inti/admin boleh baca semua & tulis', async () => {
      const guestDb = ctxUnauth().firestore();
      await assertSucceeds(
        getDocs(query(collection(guestDb, 'heroSlides'), where('active', '==', true))),
      );
      await assertFails(getDoc(doc(guestDb, 'heroSlides/s-inactive')));

      const akademikDb = ctxRole('u-ak', 'akademik').firestore();
      const kominfoDb = ctxRole('u-k', 'kominfo').firestore();
      await assertFails(setDoc(doc(akademikDb, 'heroSlides/s-new'), { active: true }));
      await assertSucceeds(getDoc(doc(kominfoDb, 'heroSlides/s-inactive')));
      await assertSucceeds(setDoc(doc(kominfoDb, 'heroSlides/s-new'), { active: true, order: 3, caption: 'Baru' }));
      await assertSucceeds(setDoc(doc(kominfoDb, 'settings/hero'), { durationSec: 7 }, { merge: true }));
    });
  });

  describe('secure/referral & referralHistory', () => {
    it('hanya inti dan admin yang boleh membaca; semua klien ditolak menulis', async () => {
      await assertFails(getDoc(doc(ctxUnauth().firestore(), 'secure/referral')));
      await assertFails(getDoc(doc(ctxRole('u-k', 'kominfo').firestore(), 'secure/referral')));
      await assertSucceeds(getDoc(doc(ctxRole('u-i', 'inti').firestore(), 'secure/referral')));
      await assertSucceeds(getDoc(doc(ctxRole('u-ad', 'admin').firestore(), 'referralHistory/h1')));
      await assertFails(setDoc(doc(ctxRole('u-ad', 'admin').firestore(), 'secure/referral'), { code: 'HACK' }));
    });
  });

  describe('courses & materials', () => {
    it('tamu/pending ditolak; semua anggota aktif boleh baca; hanya akademik/inti/admin boleh tulis dengan validasi', async () => {
      await assertFails(getDoc(doc(ctxUnauth().firestore(), 'courses/c1')));
      await assertFails(getDoc(doc(ctxRole('u-p', 'anggota', 'pending').firestore(), 'materials/m1')));
      await assertSucceeds(getDoc(doc(ctxRole('u-psdm', 'psdm').firestore(), 'materials/m1')));

      const kominfoDb = ctxRole('u-k', 'kominfo').firestore();
      const akademikDb = ctxRole('u-ak', 'akademik').firestore();
      await assertFails(setDoc(doc(kominfoDb, 'courses/c2'), { jurusan: 'TI', name: 'Algo', semester: 1 }));
      await assertSucceeds(setDoc(doc(akademikDb, 'courses/c2'), { jurusan: 'TI', name: 'Algo', semester: 1 }));
      // Invalid semester / short title rejected
      await assertFails(setDoc(doc(akademikDb, 'materials/m-bad'), { title: 'AB', type: 'link', semester: 1 }));
      await assertFails(setDoc(doc(akademikDb, 'materials/m-bad2'), { title: 'Judul Valid', type: 'link', semester: 9 }));
      await assertSucceeds(setDoc(doc(akademikDb, 'materials/m-ok'), { title: 'Modul Valid', type: 'link', semester: 2 }));
      await assertSucceeds(deleteDoc(doc(akademikDb, 'materials/m-ok')));
    });
  });

  describe('events, products & productClicks', () => {
    it('anggota aktif baca produk published; draft & tulis hanya kominfo/inti/admin', async () => {
      const guestDb = ctxUnauth().firestore();
      const anggotaDb = ctxRole('u-a', 'anggota').firestore();
      const akademikDb = ctxRole('u-ak', 'akademik').firestore();
      const kominfoDb = ctxRole('u-k', 'kominfo').firestore();

      await assertFails(getDoc(doc(guestDb, 'products/p-pub')));
      await assertSucceeds(getDoc(doc(anggotaDb, 'products/p-pub')));
      await assertFails(getDoc(doc(anggotaDb, 'products/p-draft')));
      await assertSucceeds(getDoc(doc(kominfoDb, 'products/p-draft')));

      await assertFails(
        setDoc(doc(akademikDb, 'products/p-new'), { name: 'X', price: 1000, stock: 1, status: 'published' }),
      );
      await assertFails(
        setDoc(doc(kominfoDb, 'products/p-neg'), { name: 'X', price: -5, stock: 1, status: 'published' }),
      );
      await assertSucceeds(
        setDoc(doc(kominfoDb, 'products/p-new'), { name: 'Jaket', price: 120000, stock: 10, status: 'published' }),
      );

      // productClicks: active member can create with own uid
      await assertSucceeds(setDoc(doc(anggotaDb, 'productClicks/c1'), { productId: 'p-pub', uid: 'u-a' }));
      await assertFails(setDoc(doc(anggotaDb, 'productClicks/c2'), { productId: 'p-pub', uid: 'other' }));
      await assertFails(getDoc(doc(anggotaDb, 'productClicks/c1')));
      await assertSucceeds(getDoc(doc(kominfoDb, 'productClicks/c1')));
    });
  });

  describe('journeyItems', () => {
    it('tamu hanya membaca journey aktif; kominfo/inti/admin dapat baca semua & tulis', async () => {
      const guestDb = ctxUnauth().firestore();
      const anggotaDb = ctxRole('u-a', 'anggota').firestore();
      const kominfoDb = ctxRole('u-k', 'kominfo').firestore();

      await assertSucceeds(getDoc(doc(guestDb, 'journeyItems/j-active')));
      await assertFails(getDoc(doc(guestDb, 'journeyItems/j-inactive')));
      await assertSucceeds(getDoc(doc(kominfoDb, 'journeyItems/j-inactive')));
      await assertSucceeds(getDocs(query(collection(guestDb, 'journeyItems'), where('active', '==', true))));

      await assertFails(
        setDoc(doc(anggotaDb, 'journeyItems/j-new'), {
          title: 'Makrab Baru',
          dateLabel: 'Mei 2026',
          year: 2026,
          active: true,
          order: 3,
        }),
      );
      await assertFails(
        setDoc(doc(kominfoDb, 'journeyItems/j-bad'), {
          title: 'AB',
          dateLabel: 'Mei 2026',
          year: 2026,
          active: true,
          order: 3,
        }),
      );
      await assertSucceeds(
        setDoc(doc(kominfoDb, 'journeyItems/j-new'), {
          title: 'Makrab Baru',
          dateLabel: 'Mei 2026',
          year: 2026,
          active: true,
          order: 3,
        }),
      );
    });
  });

  describe('siteContent, agenda, faculties, auditLogs & mail', () => {
    it('memvalidasi izin baca/tulis untuk koleksi CMS baru dan audit log', async () => {
      const guestDb = ctxUnauth().firestore();
      const anggotaDb = ctxRole('u-a', 'anggota').firestore();
      const akademikDb = ctxRole('u-ak', 'akademik').firestore();
      const kominfoDb = ctxRole('u-k', 'kominfo').firestore();
      const adminDb = ctxRole('u-ad', 'admin').firestore();

      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, 'siteContent/home'), { updatedBy: 'seed' });
        await setDoc(doc(db, 'agenda/ag-1'), {
          title: 'Buka Bersama',
          tag: 'Ramadan',
          order: 1,
          highlight: true,
          active: true,
        });
        await setDoc(doc(db, 'faculties/ft'), { name: 'FTE', labs: ['Lab 1'] });
        await setDoc(doc(db, 'auditLogs/log-1'), {
          actorUid: 'u-ad',
          action: 'test',
          target: 'test',
        });
      });

      // siteContent: public read, kominfo/inti/admin write
      await assertSucceeds(getDoc(doc(guestDb, 'siteContent/home')));
      await assertFails(setDoc(doc(anggotaDb, 'siteContent/home'), { updatedBy: 'u-a' }));
      await assertSucceeds(setDoc(doc(kominfoDb, 'siteContent/home'), { updatedBy: 'u-k' }));

      // agenda: public read active, kominfo/inti/admin write
      await assertSucceeds(getDoc(doc(guestDb, 'agenda/ag-1')));
      await assertFails(
        setDoc(doc(anggotaDb, 'agenda/ag-2'), {
          title: 'Baru',
          tag: 'Umum',
          order: 2,
          highlight: false,
          active: true,
        }),
      );
      await assertSucceeds(
        setDoc(doc(kominfoDb, 'agenda/ag-2'), {
          title: 'Baru',
          tag: 'Umum',
          order: 2,
          highlight: false,
          active: true,
        }),
      );

      // faculties: public read, akademik/inti/admin write
      await assertSucceeds(getDoc(doc(guestDb, 'faculties/ft')));
      await assertFails(setDoc(doc(kominfoDb, 'faculties/f2'), { name: 'Baru', labs: [] }));
      await assertSucceeds(setDoc(doc(akademikDb, 'faculties/f2'), { name: 'Baru', labs: ['Lab A'] }));

      // auditLogs: only admin reads, active user can create own log, nobody updates/deletes
      await assertFails(getDoc(doc(kominfoDb, 'auditLogs/log-1')));
      await assertSucceeds(getDoc(doc(adminDb, 'auditLogs/log-1')));
      await assertSucceeds(
        setDoc(doc(kominfoDb, 'auditLogs/log-2'), {
          actorUid: 'u-k',
          action: 'content:update',
          target: 'siteContent/home',
        }),
      );
      await assertFails(updateDoc(doc(adminDb, 'auditLogs/log-1'), { action: 'hacked' }));

      // mail: nobody reads/writes from client
      await assertFails(setDoc(doc(adminDb, 'mail/m1'), { to: ['a@b.com'] }));
    });
  });

  describe('Storage Rules', () => {
    it('memvalidasi akses unggah hero, journey, produk, materi, dan avatar', async () => {
      const guestStorage = ctxUnauth().storage();
      const anggotaStorage = ctxRole('u-a', 'anggota').storage();
      const akademikStorage = ctxRole('u-ak', 'akademik').storage();
      const kominfoStorage = ctxRole('u-k', 'kominfo').storage();

      const imgBytes = new Uint8Array([1, 2, 3, 4]);
      const pdfBytes = new Uint8Array([37, 80, 68, 70]);

      // Hero & Journey upload: kominfo allowed, anggota denied
      await assertFails(uploadBytes(ref(anggotaStorage, 'hero/test.webp'), imgBytes, { contentType: 'image/webp' }));
      await assertSucceeds(uploadBytes(ref(kominfoStorage, 'hero/test.webp'), imgBytes, { contentType: 'image/webp' }));
      await assertSucceeds(getBytes(ref(guestStorage, 'hero/test.webp')));

      await assertFails(uploadBytes(ref(anggotaStorage, 'journey/test.webp'), imgBytes, { contentType: 'image/webp' }));
      await assertSucceeds(uploadBytes(ref(kominfoStorage, 'journey/test.webp'), imgBytes, { contentType: 'image/webp' }));
      await assertSucceeds(getBytes(ref(guestStorage, 'journey/test.webp')));

      // Materials upload: akademik allowed, kominfo denied, invalid MIME denied
      await assertFails(uploadBytes(ref(kominfoStorage, 'materials/m1/doc.pdf'), pdfBytes, { contentType: 'application/pdf' }));
      await assertFails(uploadBytes(ref(akademikStorage, 'materials/m1/bad.exe'), pdfBytes, { contentType: 'application/x-msdownload' }));
      await assertSucceeds(uploadBytes(ref(akademikStorage, 'materials/m1/doc.pdf'), pdfBytes, { contentType: 'application/pdf' }));
      await assertSucceeds(getBytes(ref(anggotaStorage, 'materials/m1/doc.pdf')));

      // Avatar upload & read: pending user can upload & read own avatar, cannot overwrite others, guest cannot read
      const pendingStorage = ctxRole('u-p', 'anggota', 'pending').storage();
      await assertSucceeds(uploadBytes(ref(pendingStorage, 'avatars/u-p.webp'), imgBytes, { contentType: 'image/webp' }));
      await assertSucceeds(getBytes(ref(pendingStorage, 'avatars/u-p.webp')));
      await assertFails(uploadBytes(ref(pendingStorage, 'avatars/u-a.webp'), imgBytes, { contentType: 'image/webp' }));
      await assertFails(getBytes(ref(guestStorage, 'avatars/u-p.webp')));

      // Cleanup
      await assertSucceeds(deleteObject(ref(kominfoStorage, 'hero/test.webp')));
      await assertSucceeds(deleteObject(ref(kominfoStorage, 'journey/test.webp')));
      await assertSucceeds(deleteObject(ref(pendingStorage, 'avatars/u-p.webp')));
    });

    it('memvalidasi akses unggah foto departemen dan pengurus pada periods/{periodId}/*', async () => {
      const guestStorage = ctxUnauth().storage();
      const anggotaStorage = ctxRole('u-a', 'anggota').storage();
      const kominfoStorage = ctxRole('u-k', 'kominfo').storage();
      const intiStorage = ctxRole('u-i', 'inti').storage();
      const adminStorage = ctxRole('u-ad', 'admin').storage();

      const imgBytes = new Uint8Array([1, 2, 3, 4]);
      const pdfBytes = new Uint8Array([37, 80, 68, 70]);

      const deptPath = 'periods/2025-2026/departments/psdm.webp';
      const personPath = 'periods/2025-2026/people/ketua.webp';

      // Non-inti/admin denied
      await assertFails(uploadBytes(ref(anggotaStorage, deptPath), imgBytes, { contentType: 'image/webp' }));
      await assertFails(uploadBytes(ref(kominfoStorage, deptPath), imgBytes, { contentType: 'image/webp' }));
      await assertFails(uploadBytes(ref(kominfoStorage, personPath), imgBytes, { contentType: 'image/webp' }));

      // Non-image denied even for admin
      await assertFails(uploadBytes(ref(adminStorage, deptPath), pdfBytes, { contentType: 'application/pdf' }));
      await assertFails(uploadBytes(ref(intiStorage, personPath), pdfBytes, { contentType: 'application/pdf' }));

      // Inti & Admin allowed to upload images; public read allowed
      await assertSucceeds(uploadBytes(ref(intiStorage, deptPath), imgBytes, { contentType: 'image/webp' }));
      await assertSucceeds(uploadBytes(ref(adminStorage, personPath), imgBytes, { contentType: 'image/webp' }));
      await assertSucceeds(getBytes(ref(guestStorage, deptPath)));
      await assertSucceeds(getBytes(ref(guestStorage, personPath)));

      // Cleanup
      await assertSucceeds(deleteObject(ref(adminStorage, deptPath)));
      await assertSucceeds(deleteObject(ref(adminStorage, personPath)));
    });
  });
});
