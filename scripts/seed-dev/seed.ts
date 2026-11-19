import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { nimToEmail } from '../../functions/src/utils/nim';
import { generateReferralPayload } from '../../functions/src/utils/referral';
import { BPH_2025_2026_PERIOD, BPH_2025_2026_UNITS } from './bph-data';
import {
  ABOUT_COPY,
  AGENDA_COPY,
  BPH_COPY,
  CONTACT_COPY,
  CTA_BAND_COPY,
  CULTURE_COPY,
  HERO_COPY,
} from '../../web/src/content/site';
import { FACULTIES_AND_LABS } from '../../web/src/content/labs';

const args = process.argv.slice(2);
const isDemo = args.includes('--demo');
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-himasri';

// Default to local emulator unless explicitly running against a live project without emulator env
if (!process.env.FIRESTORE_EMULATOR_HOST && projectId.startsWith('demo-')) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
}

const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (isDemo && !isEmulator) {
  console.error('[seed] Flag --demo hanya boleh dijalankan ke Emulator!');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const db = getFirestore();
const auth = getAuth();

async function ensureAuthUser(opts: {
  uid: string;
  nim: string;
  nama: string;
  password: string;
  role: string;
  status: 'active' | 'pending';
  angkatan: number;
  jurusan: string;
  whatsapp: string;
  isAslab: boolean;
  fakultas?: string | null;
  lab?: string | null;
  jadwalAslab?: string | null;
  requestedPosition?: string;
  isSample?: boolean;
}) {
  const email = nimToEmail(opts.nim);
  let uid = opts.uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, {
      displayName: opts.nama,
      password: opts.password,
      disabled: false,
    });
  } catch {
    await auth.createUser({
      uid,
      email,
      password: opts.password,
      displayName: opts.nama,
    });
  }

  await auth.setCustomUserClaims(uid, {
    role: opts.role,
    status: opts.status,
  });

  const activePeriods = opts.status === 'active' ? ['2025-2026'] : [];

  await db.doc(`users/${uid}`).set({
    uid,
    nama: opts.nama,
    nim: opts.nim,
    angkatan: opts.angkatan,
    jurusan: opts.jurusan,
    whatsapp: opts.whatsapp,
    isAslab: opts.isAslab,
    fakultas: opts.isAslab ? opts.fakultas || null : null,
    lab: opts.isAslab ? opts.lab || null : null,
    jadwalAslab: opts.isAslab ? opts.jadwalAslab || null : null,
    requestedPosition: opts.requestedPosition || 'Anggota',
    role: opts.role,
    status: opts.status,
    activePeriods,
    referralCodeId: 'SEED',
    rejectReason: null,
    claimsUpdatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    approvedAt: opts.status === 'active' ? FieldValue.serverTimestamp() : null,
    approvedBy: opts.status === 'active' ? 'seed' : null,
    isSample: opts.isSample ?? true,
  });

  await db.doc(`nimIndex/${opts.nim}`).set({
    uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (opts.status === 'active') {
    await db.doc(`members/${uid}`).set({
      uid,
      nama: opts.nama,
      jurusan: opts.jurusan,
      angkatan: opts.angkatan,
      isAslab: opts.isAslab,
      fakultas: opts.isAslab ? opts.fakultas || null : null,
      lab: opts.isAslab ? opts.lab || null : null,
      jadwalAslab: opts.isAslab ? opts.jadwalAslab || null : null,
      whatsappAslab: opts.isAslab ? opts.whatsapp : null,
      role: opts.role,
      activePeriods,
      searchName: opts.nama.trim().toLowerCase(),
      isSample: opts.isSample ?? true,
    });
  }
}

async function seedBaseData() {
  console.log(`[seed] Mengisi data ke project "${projectId}" (${isEmulator ? 'Emulator' : 'Live'})...`);

  // 1. Period 2025-2026 + units
  const { id, ...periodPayload } = BPH_2025_2026_PERIOD;
  await db.doc(`periods/${id}`).set(
    {
      ...periodPayload,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  for (const unit of BPH_2025_2026_UNITS) {
    const { id: unitId, ...unitPayload } = unit;
    await db.doc(`periods/${id}/units/${unitId}`).set(unitPayload, { merge: true });
  }

  // 2. settings/public
  await db.doc('settings/public').set(
    {
      kahimWhatsapp: '6281234567801',
      wakahimWhatsapp: '6281234567802',
      adminWhatsapp: '6281234567800',
      email: 'himasri.official@gmail.com',
      instagram: '@himasri.official',
      alamat: 'Sekretariat HIMASRI, IT PLN',
      isSample: true,
    },
    { merge: true },
  );

  // 3. settings/hero
  await db.doc('settings/hero').set(
    {
      durationSec: 5,
      transition: 'fade',
      autoplay: true,
      respectReducedMotion: true,
    },
    { merge: true },
  );

  // 4. Default heroSlides (only seed if collection is empty or default IDs don't exist)
  await db.doc('heroSlides/default-kebersamaan').set(
    {
      imageUrl: '/assets/images/hero-kebersamaan.webp',
      storagePath: '',
      caption: 'Kebersamaan anggota HIMASRI',
      order: 1,
      active: true,
      width: 720,
      height: 1280,
      focalY: 72,
      uploadedBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await db.doc('heroSlides/default-pengurus').set(
    {
      imageUrl: '/assets/images/hero-pengurus.webp',
      storagePath: '',
      caption: 'Pengurus HIMASRI di Kampus IT PLN',
      order: 2,
      active: true,
      highlight: true,
      width: 1920,
      height: 1440,
      focalY: 45,
      uploadedBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // 4b. Journey HIMASRI timeline milestones
  const journeyMilestones = [
    {
      id: 'journey-2023-perdana',
      title: 'Kumpul Perdana & Penyambutan Mahasiswa Baru Sriwijaya',
      description:
        'Pertemuan awal keluarga besar mahasiswa asal Sumatera Selatan di kampus IT PLN untuk membangun solidaritas perantau dan pengenalan lingkungan kampus.',
      dateLabel: 'Oktober 2023',
      year: 2023,
      badge: 'Awal Kebersamaan',
      imageUrl: '/assets/images/hero-kebersamaan.webp',
      storagePath: '',
      order: 1,
      active: true,
      highlight: true,
      width: 1440,
      height: 1080,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2024-makrab',
      title: 'Malam Keakraban (Makrab) Sriwijaya',
      description:
        'Kegiatan mempererat tali persaudaraan lintas angkatan dengan pentas seni budaya Palembang, diskusi kaderisasi, dan api unggun kebersamaan.',
      dateLabel: 'Mei 2024',
      year: 2024,
      badge: 'Kaderisasi',
      imageUrl: '/assets/images/hero-pengurus.webp',
      storagePath: '',
      order: 2,
      active: true,
      highlight: true,
      width: 1920,
      height: 1440,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2025-baksos',
      title: 'Buka Bersama & Bakti Sosial Wong Kito',
      description:
        'Aksi kepedulian sosial HIMASRI di bulan Ramadan yang melibatkan seluruh anggota dan pengurus dalam berbagi kebahagiaan kepada masyarakat sekitar kampus.',
      dateLabel: 'Maret 2025',
      year: 2025,
      badge: 'Sosial Masyarakat',
      imageUrl: '/assets/images/hero-kebersamaan.webp',
      storagePath: '',
      order: 3,
      active: true,
      width: 1440,
      height: 1080,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2026-kabinet',
      title: 'Pelantikan Pengurus & Launching Ruang Anggota 2025/2026',
      description:
        'Estafet kepengurusan Kabinet 2025/2026 bersama peluncuran sistem terpadu untuk bank materi kuliah, direktori asisten lab, dan katalog kegiatan HIMASRI.',
      dateLabel: 'Februari 2026',
      year: 2026,
      badge: 'Kabinet 2025/2026',
      imageUrl: '/assets/images/hero-pengurus.webp',
      storagePath: '',
      order: 4,
      active: true,
      highlight: true,
      width: 1920,
      height: 1440,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2023-sharing-maba',
      title: 'Temu Perdana Mahasiswa Baru Sumatera Selatan',
      description:
        'Pertemuan pertama menyambut perantau baru asal Palembang dan sekitarnya di lingkungan Kampus IT PLN. Kakak tingkat berbagi pengalaman kuliah, tempat tinggal, serta cara beradaptasi di Jakarta.',
      dateLabel: 'September 2023',
      year: 2023,
      badge: 'Kekeluargaan',
      imageUrl: '/assets/images/departments/presi.webp',
      storagePath: '',
      order: 5,
      active: true,
      width: 1600,
      height: 1067,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2023-pempek-day',
      title: 'Masak Bersama Pempek & Cuko di Sekretariat',
      description:
        'Akhir pekan penuh tawa saat anggota bersama-sama mengolah pempek lenjer dan kapal selam sebagai pengobat rindu kampung halaman sekaligus mempererat keakraban lintas jurusan.',
      dateLabel: 'November 2023',
      year: 2023,
      badge: 'Budaya',
      imageUrl: '/assets/images/departments/kwu.webp',
      storagePath: '',
      order: 6,
      active: true,
      width: 1600,
      height: 1067,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2024-upgrading',
      title: 'Upgrading Pengurus & Rapat Kerja Tahunan',
      description:
        'Seluruh pengurus harian merumuskan program kerja setahun ke depan, menyelaraskan visi antar departemen, dan membangun ritme koordinasi yang solid.',
      dateLabel: 'Februari 2024',
      year: 2024,
      badge: 'Organisasi',
      imageUrl: '/assets/images/departments/psdm.webp',
      storagePath: '',
      order: 7,
      active: true,
      width: 1600,
      height: 1067,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2024-bukber',
      title: 'Buka Puasa Bersama Lintas Angkatan 2024',
      description:
        'Lebih dari seratus anggota dan alumni berkumpul dalam suasana hangat Ramadan. Acara diisi tausiah singkat, berbagi takjil di sekitar kampus, serta sesi foto keluarga besar.',
      dateLabel: 'April 2024',
      year: 2024,
      badge: 'Ramadan',
      imageUrl: '/assets/images/hero-kebersamaan.webp',
      storagePath: '',
      order: 8,
      active: true,
      width: 1440,
      height: 1080,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2024-bedah-uts',
      title: 'Kelas Belajar Bersama & Bedah Soal UTS',
      description:
        'Divisi Akademik & Keilmuan mengadakan sesi belajar kelompok menjelang ujian tengah semester untuk mata kuliah dasar teknik bersama para asisten laboratorium HIMASRI.',
      dateLabel: 'Oktober 2024',
      year: 2024,
      badge: 'Akademik',
      imageUrl: '/assets/images/departments/pendidikan.webp',
      storagePath: '',
      order: 9,
      active: true,
      width: 1600,
      height: 1067,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2024-hut',
      title: 'Perayaan HUT HIMASRI & Pentas Seni Sriwijaya',
      description:
        'Malam puncak ulang tahun himpunan dengan penampilan Tari Gending Sriwijaya, pameran kain songket, dan pemotongan tumpeng sebagai wujud syukur atas perjalanan panjang HIMASRI.',
      dateLabel: 'Desember 2024',
      year: 2024,
      badge: 'HUT HIMASRI',
      imageUrl: '/assets/images/hero-pengurus.webp',
      storagePath: '',
      order: 10,
      active: true,
      highlight: true,
      width: 1920,
      height: 1440,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2025-sosmas',
      title: 'HIMASRI Peduli & Kunjungan Panti Asuhan',
      description:
        'Pengurus dan relawan menyalurkan paket sembako, alat tulis, serta mengadakan permainan edukatif bersama adik-adik panti asuhan di Jakarta Barat.',
      dateLabel: 'Juni 2025',
      year: 2025,
      badge: 'Sosial Masyarakat',
      imageUrl: '/assets/images/departments/sosmas.webp',
      storagePath: '',
      order: 11,
      active: true,
      width: 1600,
      height: 1067,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2025-famgath',
      title: 'Family Gathering & Outbound Cisarua',
      description:
        'Dua hari penuh kebersamaan di luar kampus untuk melepas penat perkuliahan, memperkuat komunikasi lintas angkatan, dan menciptakan kenangan tak terlupakan.',
      dateLabel: 'Agustus 2025',
      year: 2025,
      badge: 'Kebersamaan',
      imageUrl: '/assets/images/departments/medfo.webp',
      storagePath: '',
      order: 12,
      active: true,
      highlight: true,
      width: 1600,
      height: 1067,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2025-pkkmb',
      title: 'Stand Budaya Palembang pada Expo Ormawa IT PLN',
      description:
        'HIMASRI membuka stan perkenalan budaya Sumatera Selatan lengkap dengan miniatur Jembatan Ampera, busana tanjak, dan informasi kegiatan bagi mahasiswa baru.',
      dateLabel: 'September 2025',
      year: 2025,
      badge: 'Expo Kampus',
      imageUrl: '/assets/images/departments/presi.webp',
      storagePath: '',
      order: 13,
      active: true,
      width: 1600,
      height: 1067,
      uploadedBy: 'seed',
      isSample: true,
    },
    {
      id: 'journey-2026-kongres',
      title: 'Musyawarah Besar & Estafet Kepengurusan Baru',
      description:
        'Forum tertinggi himpunan untuk mengevaluasi perjalanan satu periode, menyempurnakan AD/ART, dan mengukuhkan nakhoda baru HIMASRI IT PLN.',
      dateLabel: 'April 2026',
      year: 2026,
      badge: 'Musyawarah Besar',
      imageUrl: '/assets/images/hero-kebersamaan.webp',
      storagePath: '',
      order: 14,
      active: true,
      width: 1440,
      height: 1080,
      uploadedBy: 'seed',
      isSample: true,
    },
  ];
  for (const item of journeyMilestones) {
    const { id: itemId, ...itemData } = item;
    await db.doc(`journeyItems/${itemId}`).set(
      {
        ...itemData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  // 5. Events
  const events = [
    { id: 'hut-himasri-2026', name: 'HUT HIMASRI 2026', contactWhatsapp: '6281234567803', active: true, order: 1, isSample: true },
    { id: 'family-gathering', name: 'Family Gathering', contactWhatsapp: '6281234567804', active: true, order: 2, isSample: true },
    { id: 'buka-bersama', name: 'Buka Bersama', contactWhatsapp: '6281234567805', active: true, order: 3, isSample: true },
  ];
  for (const ev of events) {
    const { id: evId, ...evData } = ev;
    await db.doc(`events/${evId}`).set(evData, { merge: true });
  }

  // 6. Products
  const products = [
    {
      id: 'kaos-himasri-songket',
      eventId: 'hut-himasri-2026',
      eventName: 'HUT HIMASRI 2026',
      name: 'Kaos HIMASRI Songket',
      price: 95000,
      stock: 40,
      imageUrl: '/assets/images/products/kaos-songket.webp',
      description: 'Kaos katun combed 24s edisi HUT HIMASRI dengan aksen motif songket emas.',
      status: 'published',
      isSample: true,
    },
    {
      id: 'totebag-motif-songket',
      eventId: 'hut-himasri-2026',
      eventName: 'HUT HIMASRI 2026',
      name: 'Totebag Motif Songket',
      price: 60000,
      stock: 35,
      imageUrl: '/assets/images/products/totebag-songket.webp',
      description: 'Totebag kanvas tebal muat laptop 14 inci dengan sablon songket Palembang.',
      status: 'published',
      isSample: true,
    },
    {
      id: 'ganci-ampera',
      eventId: 'hut-himasri-2026',
      eventName: 'HUT HIMASRI 2026',
      name: 'Gantungan Kunci Ampera',
      price: 15000,
      stock: 60,
      imageUrl: '/assets/images/products/ganci-ampera.webp',
      description: 'Gantungan kunci akrilik dua sisi bergambar Jembatan Ampera.',
      status: 'published',
      isSample: true,
    },
    {
      id: 'stiker-wong-kito',
      eventId: 'hut-himasri-2026',
      eventName: 'HUT HIMASRI 2026',
      name: 'Stiker Pack Wong Kito',
      price: 10000,
      stock: 30,
      imageUrl: '/assets/images/products/stiker-wong-kito.webp',
      description: 'Paket 6 stiker vinyl tahan air bertema budaya Palembang & HIMASRI.',
      status: 'published',
      isSample: true,
    },
    {
      id: 'topi-himasri',
      eventId: 'hut-himasri-2026',
      eventName: 'HUT HIMASRI 2026',
      name: 'Topi HIMASRI',
      price: 55000,
      stock: 15,
      imageUrl: '/assets/images/products/topi-himasri.webp',
      description: 'Topi maroon bordir logo HIMASRI dan aksen benang emas.',
      status: 'published',
      isSample: true,
    },
    {
      id: 'pin-enamel-sriwijaya',
      eventId: 'hut-himasri-2026',
      eventName: 'HUT HIMASRI 2026',
      name: 'Pin Enamel Sriwijaya',
      price: 20000,
      stock: 0,
      imageUrl: '/assets/images/products/pin-sriwijaya.webp',
      description: 'Pin enamel logam edisi terbatas dengan motif tanjak dan songket.',
      status: 'published',
      isSample: true,
    },
  ];
  for (const prod of products) {
    const { id: prodId, ...prodData } = prod;
    await db.doc(`products/${prodId}`).set(
      {
        ...prodData,
        createdBy: 'seed',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  // 6b. Site Content (Beranda + Budaya Palembang dengan foto lokal terverifikasi)
  await db.doc('siteContent/home').set(
    {
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
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'seed',
    },
    { merge: true },
  );

  // 6c. Agenda Tahunan
  for (let i = 0; i < AGENDA_COPY.items.length; i += 1) {
    const ag = AGENDA_COPY.items[i];
    await db.doc(`agenda/agenda-default-${i + 1}`).set(
      {
        title: ag.title,
        tag: ag.tag,
        dateLabel: ag.tag,
        description: ag.description,
        highlight: i === 0,
        order: i + 1,
        periodId: '2025-2026',
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  // 6d. Fakultas & Laboratorium
  for (let i = 0; i < FACULTIES_AND_LABS.length; i += 1) {
    const fac = FACULTIES_AND_LABS[i];
    await db.doc(`faculties/faculty-${i + 1}`).set(
      {
        name: fac.fakultas,
        labs: [...fac.labs],
        order: i + 1,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  // 7. Courses
  const courses = [
    { id: 'if-smt1-algoritma', jurusan: 'S1 Teknik Informatika', name: 'Algoritma & Pemrograman', semester: 1 },
    { id: 'if-smt1-kalkulus', jurusan: 'S1 Teknik Informatika', name: 'Kalkulus I', semester: 1 },
    { id: 'if-smt1-fisika', jurusan: 'S1 Teknik Informatika', name: 'Fisika Dasar', semester: 1 },
    { id: 'if-smt2-struktur-data', jurusan: 'S1 Teknik Informatika', name: 'Struktur Data', semester: 2 },
    { id: 'if-smt2-matdis', jurusan: 'S1 Teknik Informatika', name: 'Matematika Diskrit', semester: 2 },
    { id: 'if-smt3-basis-data', jurusan: 'S1 Teknik Informatika', name: 'Basis Data', semester: 3 },
    { id: 'if-smt3-jarkom', jurusan: 'S1 Teknik Informatika', name: 'Jaringan Komputer', semester: 3 },
  ];
  for (const course of courses) {
    const { id: courseId, ...courseData } = course;
    await db.doc(`courses/${courseId}`).set(
      {
        ...courseData,
        materialCount: 0,
        createdBy: 'seed',
        createdAt: FieldValue.serverTimestamp(),
        isSample: true,
      },
      { merge: true },
    );
  }

  // 8. Referral code (create if missing)
  const referralSnap = await db.doc('secure/referral').get();
  if (!referralSnap.exists) {
    const payload = generateReferralPayload(new Date());
    await db.doc('secure/referral').set({
      code: payload.code,
      periodLabel: payload.periodLabel,
      validFrom: Timestamp.fromDate(payload.validFrom),
      validUntil: Timestamp.fromDate(payload.validUntil),
      usedCount: 0,
      rotatedAt: FieldValue.serverTimestamp(),
      rotatedBy: 'seed',
    });
    console.log(`[seed] Kode referal awal dibuat: ${payload.code} (${payload.periodLabel})`);
  }
}

async function seedDemoAccounts() {
  console.log('[seed] Membuat akun peran & 18 anggota/aslab contoh untuk Emulator (--demo)...');

  const roleAccounts = [
    {
      uid: 'demo-admin',
      nim: '202231001',
      nama: 'Admin HIMASRI Demo',
      password: 'Password123',
      role: 'admin',
      status: 'active' as const,
      angkatan: 2022,
      jurusan: 'S1 Teknik Informatika',
      whatsapp: '6281234567800',
      isAslab: false,
      requestedPosition: 'Admin Sistem',
      isSample: false,
    },
    {
      uid: 'demo-inti',
      nim: '202231002',
      nama: 'Muhammad Southlan Andry Aqmar (Demo)',
      password: 'Password123',
      role: 'inti',
      status: 'active' as const,
      angkatan: 2022,
      jurusan: 'S1 Bisnis Energi',
      whatsapp: '6281234567801',
      isAslab: false,
      requestedPosition: 'Ketua Himpunan',
      isSample: true,
    },
    {
      uid: 'demo-kominfo',
      nim: '202331003',
      nama: 'Tiara Jannah (Demo)',
      password: 'Password123',
      role: 'kominfo',
      status: 'active' as const,
      angkatan: 2023,
      jurusan: 'S1 Teknik Sistem Energi',
      whatsapp: '6281234567803',
      isAslab: false,
      requestedPosition: 'Kepala Biro',
      isSample: true,
    },
    {
      uid: 'demo-akademik',
      nim: '202331004',
      nama: 'Muhammad Rezah (Demo)',
      password: 'Password123',
      role: 'akademik',
      status: 'active' as const,
      angkatan: 2023,
      jurusan: 'S1 Teknik Tenaga Listrik',
      whatsapp: '6281234567804',
      isAslab: true,
      fakultas: 'Fakultas Ketenagalistrikan dan Energi Terbarukan',
      lab: 'Lab Sistem Tenaga',
      jadwalAslab: 'Sel & Kam · 10.00–12.00',
      requestedPosition: 'Kepala Biro',
      isSample: true,
    },
    {
      uid: 'demo-psdm',
      nim: '202331005',
      nama: 'Alif Fatahillah (Demo)',
      password: 'Password123',
      role: 'psdm',
      status: 'active' as const,
      angkatan: 2023,
      jurusan: 'S1 Teknik Informatika',
      whatsapp: '6281234567805',
      isAslab: true,
      fakultas: 'Fakultas Telematika Energi',
      lab: 'Lab Pemrograman Dasar',
      jadwalAslab: 'Sen & Rab · 13.00–16.00',
      requestedPosition: 'Anggota Departemen/Biro',
      isSample: true,
    },
    {
      uid: 'demo-minat',
      nim: '202431006',
      nama: 'Raka Pratama (Demo)',
      password: 'Password123',
      role: 'minat_bakat',
      status: 'active' as const,
      angkatan: 2024,
      jurusan: 'S1 Sistem Informasi',
      whatsapp: '6281234567806',
      isAslab: false,
      requestedPosition: 'Anggota',
      isSample: true,
    },
    {
      uid: 'demo-anggota',
      nim: '202431007',
      nama: 'Nadia Putri Palembang',
      password: 'Password123',
      role: 'anggota',
      status: 'active' as const,
      angkatan: 2024,
      jurusan: 'S1 Teknik Informatika',
      whatsapp: '6281234567807',
      isAslab: false,
      requestedPosition: 'Anggota',
      isSample: true,
    },
    {
      uid: 'demo-pending',
      nim: '202531008',
      nama: 'Farhan Hidayatullah',
      password: 'Password123',
      role: 'anggota',
      status: 'pending' as const,
      angkatan: 2025,
      jurusan: 'S1 Teknik Elektro',
      whatsapp: '6281234567808',
      isAslab: false,
      requestedPosition: 'Anggota',
      isSample: true,
    },
  ];

  for (const acc of roleAccounts) {
    await ensureAuthUser(acc);
  }

  // 12 non-BPH active members + 6 aslab samples in `members`
  const sampleMembers = [
    { id: 'sample-m1', nama: 'Bagas Kurniawan', jurusan: 'S1 Teknik Informatika', angkatan: 2024, isAslab: false },
    { id: 'sample-m2', nama: 'Dinda Maharani', jurusan: 'S1 Sistem Informasi', angkatan: 2024, isAslab: false },
    { id: 'sample-m3', nama: 'Fajar Ramadhan', jurusan: 'S1 Teknik Elektro', angkatan: 2023, isAslab: false },
    { id: 'sample-m4', nama: 'Gita Permata Sari', jurusan: 'S1 Teknik Industri', angkatan: 2024, isAslab: false },
    { id: 'sample-m5', nama: 'Hendra Wijaya', jurusan: 'S1 Teknik Tenaga Listrik', angkatan: 2022, isAslab: false },
    { id: 'sample-m6', nama: 'Intan Kusuma', jurusan: 'S1 Bisnis Energi', angkatan: 2025, isAslab: false },
    { id: 'sample-m7', nama: 'Joko Prasetyo', jurusan: 'S1 Teknik Sipil', angkatan: 2023, isAslab: false },
    { id: 'sample-m8', nama: 'Kurnia Lestari', jurusan: 'S1 Teknik Sistem Energi', angkatan: 2024, isAslab: false },
    { id: 'sample-m9', nama: 'Larasati Dewi', jurusan: 'S1 Teknik Mesin', angkatan: 2025, isAslab: false },
    { id: 'sample-m10', nama: 'M. Rizky Saputra', jurusan: 'D3 Teknologi Listrik', angkatan: 2024, isAslab: false },
    { id: 'sample-m11', nama: 'Naufal Hakim', jurusan: 'S1 Teknik Informatika', angkatan: 2025, isAslab: false },
    { id: 'sample-m12', nama: 'Putri Ayu Wulandari', jurusan: 'S1 Sistem Informasi', angkatan: 2023, isAslab: false },
    {
      id: 'sample-aslab1',
      nama: 'Rizka Amalia',
      jurusan: 'S1 Teknik Informatika',
      angkatan: 2023,
      isAslab: true,
      fakultas: 'Fakultas Telematika Energi',
      lab: 'Lab Basis Data',
      jadwalAslab: 'Sel & Kam · 13.00–15.30',
      whatsappAslab: '6281234567821',
    },
    {
      id: 'sample-aslab2',
      nama: 'Dimas Pradipta',
      jurusan: 'S1 Teknik Informatika',
      angkatan: 2022,
      isAslab: true,
      fakultas: 'Fakultas Telematika Energi',
      lab: 'Lab Jaringan Komputer',
      jadwalAslab: 'Rab & Jum · 09.00–12.00',
      whatsappAslab: '6281234567822',
    },
    {
      id: 'sample-aslab3',
      nama: 'Salsabila Azzahra',
      jurusan: 'S1 Teknik Elektro',
      angkatan: 2023,
      isAslab: true,
      fakultas: 'Fakultas Ketenagalistrikan dan Energi Terbarukan',
      lab: 'Lab Elektronika Dasar',
      jadwalAslab: 'Sen · 10.00–14.00',
      whatsappAslab: '6281234567823',
    },
    {
      id: 'sample-aslab4',
      nama: 'Yoga Pratama',
      jurusan: 'S1 Teknik Sistem Energi',
      angkatan: 2022,
      isAslab: true,
      fakultas: 'Fakultas Ketenagalistrikan dan Energi Terbarukan',
      lab: 'Lab Konversi Energi',
      jadwalAslab: 'Kam · 14.00–17.00',
      whatsappAslab: '6281234567824',
    },
    {
      id: 'sample-aslab5',
      nama: 'Tania Octaviani',
      jurusan: 'S1 Teknik Industri',
      angkatan: 2023,
      isAslab: true,
      fakultas: 'Fakultas Teknologi dan Bisnis Energi',
      lab: 'Lab Teknik Industri',
      jadwalAslab: 'Sel · 13.00–16.00',
      whatsappAslab: '6281234567825',
    },
    {
      id: 'sample-aslab6',
      nama: 'Ilham Akbar',
      jurusan: 'S1 Teknik Sipil',
      angkatan: 2022,
      isAslab: true,
      fakultas: 'Fakultas Teknologi Infrastruktur dan Kewilayahan',
      lab: 'Lab Teknik Sipil',
      jadwalAslab: 'Jum · 13.30–16.30',
      whatsappAslab: '6281234567826',
    },
  ];

  for (const m of sampleMembers) {
    await db.doc(`members/${m.id}`).set(
      {
        uid: m.id,
        nama: m.nama,
        jurusan: m.jurusan,
        angkatan: m.angkatan,
        isAslab: m.isAslab,
        fakultas: m.isAslab ? m.fakultas || null : null,
        lab: m.isAslab ? m.lab || null : null,
        jadwalAslab: m.isAslab ? m.jadwalAslab || null : null,
        whatsappAslab: m.isAslab ? m.whatsappAslab || null : null,
        role: 'anggota',
        activePeriods: ['2025-2026'],
        searchName: m.nama.toLowerCase(),
        isSample: true,
      },
      { merge: true },
    );
  }
}

async function main() {
  await seedBaseData();
  if (isDemo) {
    await seedDemoAccounts();
  }
  console.log('[seed] Selesai!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
