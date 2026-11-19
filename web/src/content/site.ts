export interface PillarItem {
  id: string;
  title: string;
  description: string;
  variant: 'maroon' | 'gold' | 'creamGold';
}

export interface CultureItem {
  id: string;
  icon: 'songket' | 'utensils' | 'ampera' | 'landmark' | 'music' | 'waves';
  category: string;
  title: string;
  description: string;
  surface?: 'white' | 'cream';
  imageUrl?: string;
  storagePath?: string;
  imageCredit?: string;
}

export interface AgendaItem {
  tag: string;
  title: string;
  description: string;
}

export const HERO_COPY = {
  badgeDesktop: 'Himpunan Mahasiswa Sriwijaya · IT PLN',
  badgeMobile: 'HIMASRI · IT PLN',
  title: 'Rumah Mahasiswa Sriwijaya di IT PLN.',
  subtitle:
    'Wong Kito Galo. Kami merawat budaya Palembang, mempererat kekeluargaan, dan tumbuh berprestasi bersama.',
  ctaPrimary: 'Kenali HIMASRI',
  ctaSecondary: 'Masuk Anggota',
} as const;

export const ABOUT_COPY = {
  title: 'Tentang HIMASRI',
  statement: 'Wong Kito Galo.',
  leftLead:
    'Satu rumah bagi mahasiswa asal Sumatera Selatan di Institut Teknologi PLN, sejak kampus ini masih bernama STT-PLN.',
  paragraph:
    'Himpunan Mahasiswa Sriwijaya (HIMASRI) adalah organisasi daerah yang menaungi mahasiswa asal Sumatera Selatan di IT PLN. Di sini anggota saling membantu beradaptasi di perantauan, belajar bersama, dan memperkenalkan budaya Palembang kepada civitas kampus.',
  pillars: [
    {
      id: 'kekeluargaan',
      title: 'Kekeluargaan',
      description: 'Saling menjaga selama kuliah di perantauan.',
      variant: 'maroon',
    },
    {
      id: 'budaya',
      title: 'Budaya',
      description: 'Melestarikan dan mengenalkan budaya Sumatera Selatan.',
      variant: 'gold',
    },
    {
      id: 'prestasi',
      title: 'Prestasi',
      description: 'Ruang belajar dan berkembang, akademik maupun nonakademik.',
      variant: 'creamGold',
    },
  ] satisfies PillarItem[],
} as const;

export const CULTURE_COPY = {
  title: 'Warisan budaya yang kami rawat',
  description: 'Dari tenun songket hingga Sungai Musi, identitas yang kami bawa ke kampus.',
  items: [
    {
      id: 'songket',
      icon: 'songket',
      category: 'Wastra',
      title: 'Kain Songket',
      description:
        'Tenun benang emas warisan Kesultanan Palembang Darussalam, simbol kemuliaan wong kito.',
      imageUrl: '/assets/images/budaya/songket.webp',
      imageCredit: 'Foto: Afrinaldi Zulhen / CC BY-SA 4.0',
    },
    {
      id: 'pempek',
      icon: 'utensils',
      category: 'Kuliner',
      title: 'Pempek & Cuko',
      description:
        'Olahan ikan tenggiri dan sagu berkuah cuko pedas-manis, ikon kuliner Palembang.',
      imageUrl: '/assets/images/budaya/pempek.webp',
      imageCredit: 'Foto: Midori / CC BY-SA 3.0',
    },
    {
      id: 'ampera',
      icon: 'ampera',
      category: 'Ikon Kota',
      title: 'Jembatan Ampera',
      description:
        'Dibangun 1962–1965, menghubungkan Seberang Ulu dan Seberang Ilir di atas Sungai Musi.',
      imageUrl: '/assets/images/budaya/ampera.webp',
      imageCredit: 'Foto: Herusutimbul / CC BY-SA 4.0',
    },
    {
      id: 'limas',
      icon: 'landmark',
      category: 'Arsitektur',
      title: 'Rumah Limas',
      description:
        'Rumah panggung berundak (kekijing) yang mencerminkan tatanan sosial masyarakat Palembang.',
      imageUrl: '/assets/images/budaya/limas.webp',
      imageCredit: 'Foto: Fernando Tri Tanjung / CC BY-SA 4.0',
    },
    {
      id: 'gending',
      icon: 'music',
      category: 'Seni Tari',
      title: 'Tari Gending Sriwijaya',
      description:
        'Tarian penyambutan tamu agung yang menggambarkan keramahan dan kejayaan Sriwijaya.',
      imageUrl: '/assets/images/budaya/gending.webp',
      imageCredit: 'Foto: Robih Ardiatama / CC BY-SA 4.0',
    },
    {
      id: 'musi',
      icon: 'waves',
      category: 'Alam & Sejarah',
      title: 'Sungai Musi',
      description:
        'Urat nadi Palembang sejak era Sriwijaya: jalur dagang, budaya, dan rumah rakit.',
      imageUrl: '/assets/images/budaya/musi.webp',
      imageCredit: 'Foto: Oka1302 / CC BY-SA 4.0',
    },
  ] satisfies CultureItem[],
} as const;

export const BPH_COPY = {
  title: 'Badan Pengurus Harian',
  description:
    'Pengurus inti serta kepala departemen dan biro yang memimpin HIMASRI periode ini.',
  lockNotice:
    'Susunan lengkap tiap departemen dan daftar anggota aktif hanya dapat dilihat oleh anggota HIMASRI.',
} as const;

export const AGENDA_COPY = {
  title: 'Agenda Tahunan',
  subtitle: 'Tradisi yang selalu kami jaga',
  items: [] as AgendaItem[],
} as const;

export const CONTACT_COPY = {
  title: 'Ada pertanyaan tentang HIMASRI?',
  description: 'Chat langsung Ketua atau Wakil Ketua Himpunan lewat WhatsApp.',
  defaultWhatsappMessage: 'Halo Kak, saya ingin bertanya tentang HIMASRI.',
} as const;

export const CTA_BAND_COPY = {
  title: 'Anggota HIMASRI? Masuk ke ruang anggota.',
  description:
    'Akses materi kuliah tiap jurusan, kontak asisten lab, struktur lengkap tiap departemen, dan toko event HIMASRI. Pendaftaran akun memerlukan kode referal dari pengurus.',
} as const;

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'default-ampera',
    imageUrl: '/assets/images/budaya/ampera.webp',
    fallbackUrl: '/assets/images/budaya/ampera.webp',
    storagePath: '',
    caption: 'Jembatan Ampera Palembang — Warisan Sumatera Selatan',
    order: 1,
    active: true,
    width: 1600,
    height: 1067,
    focalY: 50,
  },
] as const;

export interface AccessMatrixRow {
  feature: string;
  tamu: 'V' | 'E' | '—';
  anggota: 'V' | 'E' | '—';
  psdm: 'V' | 'E' | '—';
  minat_bakat: 'V' | 'E' | '—';
  akademik: 'V' | 'E' | '—';
  kominfo: 'V' | 'E' | '—';
  inti: 'V' | 'E' | '—';
  admin: 'V' | 'E' | '—';
}

export const ACCESS_MATRIX_ROWS: AccessMatrixRow[] = [
  { feature: 'Beranda publik', tamu: 'V', anggota: 'V', psdm: 'V', minat_bakat: 'V', akademik: 'V', kominfo: 'V', inti: 'V', admin: 'E' },
  { feature: 'Struktur & anggota', tamu: '—', anggota: 'V', psdm: 'V', minat_bakat: 'V', akademik: 'V', kominfo: 'V', inti: 'V', admin: 'E' },
  { feature: 'Materi kuliah (lihat/unduh)', tamu: '—', anggota: 'V', psdm: 'V', minat_bakat: 'V', akademik: 'V', kominfo: 'V', inti: 'V', admin: 'E' },
  { feature: 'Unggah/ubah/hapus materi & mata kuliah', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: 'E', kominfo: '—', inti: 'E', admin: 'E' },
  { feature: 'Asisten lab', tamu: '—', anggota: 'V', psdm: 'V', minat_bakat: 'V', akademik: 'V', kominfo: 'V', inti: 'V', admin: 'E' },
  { feature: 'Toko (lihat)', tamu: '—', anggota: 'V', psdm: 'V', minat_bakat: 'V', akademik: 'V', kominfo: 'V', inti: 'V', admin: 'E' },
  { feature: 'Foto beranda (hero)', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: 'E', inti: 'E', admin: 'E' },
  { feature: 'Konten beranda & agenda', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: 'E', inti: 'E', admin: 'E' },
  { feature: 'Fakultas & laboratorium', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: 'E', kominfo: '—', inti: 'E', admin: 'E' },
  { feature: 'Kelola asisten lab', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: '—', inti: '—', admin: 'E' },
  { feature: 'Produk & event', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: 'E', inti: 'E', admin: 'E' },
  { feature: 'Kode referal', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: '—', inti: 'V', admin: 'E' },
  { feature: 'Periode & susunan BPH', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: '—', inti: 'E', admin: 'E' },
  { feature: 'Kelola pengguna & peran', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: '—', inti: '—', admin: 'E' },
  { feature: 'Log audit', tamu: '—', anggota: '—', psdm: '—', minat_bakat: '—', akademik: '—', kominfo: '—', inti: '—', admin: 'V' },
];
