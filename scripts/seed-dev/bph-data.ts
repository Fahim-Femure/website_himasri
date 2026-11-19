export const BPH_2025_2026_PERIOD = {
  id: '2025-2026',
  label: '2025/2026',
  isCurrent: true,
  startYear: 2025,
  inti: [
    {
      position: 'Ketua Himpunan',
      nama: 'Muhammad Southlan Andry Aqmar',
      jurusan: 'S1 Bisnis Energi',
    },
    {
      position: 'Wakil Ketua Himpunan',
      nama: 'Zaskia Rofida',
      jurusan: 'S1 Sistem Informasi',
    },
    {
      position: 'Forkom',
      nama: 'Faris Elhimma Fadli',
      jurusan: 'S1 Teknik Elektro',
    },
    {
      position: 'Sekretaris Jenderal',
      nama: 'Ari Apriansyah Putra',
      jurusan: 'S1 Sistem Informasi',
    },
    {
      position: 'Sekretaris',
      nama: 'Gabriela Marseinar Girsang',
      jurusan: 'S1 Teknik Tenaga Listrik',
    },
    {
      position: 'Bendahara',
      nama: 'Tesalonika Mariam Silitonga',
      jurusan: 'S1 Teknik Industri',
    },
  ],
  heads: [
    {
      kind: 'DEPARTEMEN' as const,
      unit: 'Departemen Pengembangan Sumber Daya Mahasiswa',
      jabatan: 'Kepala Departemen',
      nama: 'Muhammad Nabielsyah Alhazmi Athallah',
      jurusan: 'S1 Bisnis Energi',
      color: 'red-600' as const,
    },
    {
      kind: 'DEPARTEMEN' as const,
      unit: 'Departemen Kewirausahaan',
      jabatan: 'Kepala Departemen',
      nama: 'Mgs. M. Fahim Rahmatullah',
      jurusan: 'S1 Teknik Informatika',
      color: 'gold-400' as const,
    },
    {
      kind: 'DEPARTEMEN' as const,
      unit: 'Departemen Sosial Masyarakat',
      jabatan: 'Ketua Departemen',
      nama: 'Siti Nabila Azzahra',
      jurusan: 'S1 Teknik Industri',
      color: 'maroon-500' as const,
    },
    {
      kind: 'BIRO' as const,
      unit: 'Biro Pendidikan',
      jabatan: 'Kepala Biro',
      nama: 'Muhammad Rezah',
      jurusan: 'S1 Teknik Tenaga Listrik',
      color: 'gold-300' as const,
    },
    {
      kind: 'BIRO' as const,
      unit: 'Biro Media Komunikasi & Informasi',
      jabatan: 'Kepala Biro',
      nama: 'Tiara Jannah',
      jurusan: 'S1 Teknik Sistem Energi',
      color: 'maroon-950' as const,
    },
  ],
};

export const BPH_2025_2026_UNITS = [
  {
    id: 'psdm',
    kind: 'DEPARTEMEN' as const,
    name: 'Departemen Pengembangan Sumber Daya Mahasiswa',
    color: 'red-600' as const,
    order: 1,
    leaders: [
      {
        jabatan: 'Kepala Departemen',
        nama: 'Muhammad Nabielsyah Alhazmi Athallah',
        jurusan: 'S1 Bisnis Energi',
      },
    ],
    members: [
      { nama: 'Syarifaturroihanah Maulidiyah', jurusan: 'S1 Teknik Sistem Energi' },
      { nama: 'Nayla Putri Zhafira', jurusan: 'S1 Teknik Sipil' },
      { nama: 'Alif Fatahillah', jurusan: 'S1 Teknik Informatika' },
      { nama: 'Fatimah Azzahra', jurusan: 'D3 Teknologi Listrik' },
      { nama: 'Dzaky Rafii Hibatullah', jurusan: 'S1 Teknik Mesin' },
    ],
  },
  {
    id: 'kewirausahaan',
    kind: 'DEPARTEMEN' as const,
    name: 'Departemen Kewirausahaan',
    color: 'gold-400' as const,
    order: 2,
    leaders: [
      {
        jabatan: 'Kepala Departemen',
        nama: 'Mgs. M. Fahim Rahmatullah',
        jurusan: 'S1 Teknik Informatika',
      },
      {
        jabatan: 'Wakil Ketua Departemen',
        nama: 'David Atiyah',
        jurusan: 'S1 Teknik Industri',
      },
    ],
    members: [
      { nama: 'Uriel Maratyo', jurusan: 'S1 Teknik Elektro' },
      { nama: 'Luthfi Pratama Darmawan', jurusan: 'S1 Teknik Tenaga Listrik' },
      { nama: 'Rasya Agustria Sambas', jurusan: 'S1 Bisnis Energi' },
      { nama: 'Muhammad Wildan Zhilan', jurusan: 'S1 Teknik Elektro' },
      { nama: 'Muhammad Adhitya Pradito', jurusan: 'S1 Teknik Tenaga Listrik' },
    ],
  },
  {
    id: 'sosmas',
    kind: 'DEPARTEMEN' as const,
    name: 'Departemen Sosial Masyarakat',
    color: 'maroon-500' as const,
    order: 3,
    leaders: [
      {
        jabatan: 'Ketua Departemen',
        nama: 'Siti Nabila Azzahra',
        jurusan: 'S1 Teknik Industri',
      },
      {
        jabatan: 'Wakil Ketua Departemen',
        nama: 'Zulia Annisa',
        jurusan: 'S1 Sistem Informasi',
      },
    ],
    members: [
      { nama: 'Aqila Putri K', jurusan: 'S1 Teknik Industri' },
      { nama: 'Bintang Aura Mahadewi', jurusan: 'S1 Sistem Informasi' },
      { nama: 'Muhammad Raja Firzatulah', jurusan: 'S1 Teknik Industri' },
      { nama: 'Rahmad Fitriansyah', jurusan: 'S1 Teknik Sistem Energi' },
    ],
  },
  {
    id: 'pendidikan',
    kind: 'BIRO' as const,
    name: 'Biro Pendidikan',
    color: 'gold-300' as const,
    order: 4,
    leaders: [
      {
        jabatan: 'Kepala Biro',
        nama: 'Muhammad Rezah',
        jurusan: 'S1 Teknik Tenaga Listrik',
      },
      {
        jabatan: 'Wakil Kepala Biro',
        nama: 'Sherene Al Aquila Rindea',
        jurusan: 'S1 Teknik Sistem Energi',
      },
    ],
    members: [
      { nama: 'David Fatchur Rahman', jurusan: 'S1 Teknik Tenaga Listrik' },
      { nama: 'Masagus Atha Abhinaya', jurusan: 'S1 Teknik Elektro' },
      { nama: 'Raniyah Rizqi Ramadhani', jurusan: 'S1 Teknik Industri' },
      { nama: 'Ahmad Fadli Syahputra', jurusan: 'S1 Bisnis Energi' },
      { nama: 'Faiz Raihan', jurusan: 'S1 Teknik Tenaga Listrik' },
    ],
  },
  {
    id: 'kominfo',
    kind: 'BIRO' as const,
    name: 'Biro Media Komunikasi & Informasi',
    color: 'maroon-950' as const,
    order: 5,
    leaders: [
      {
        jabatan: 'Kepala Biro',
        nama: 'Tiara Jannah',
        jurusan: 'S1 Teknik Sistem Energi',
      },
      {
        jabatan: 'Wakil Kepala Biro',
        nama: 'Auliya Khoirunnisa',
        jurusan: 'S1 Teknik Sistem Energi',
      },
    ],
    members: [
      { nama: 'Zaskia Anifa Rahma', jurusan: 'S1 Teknik Industri' },
      { nama: 'Abdul Aziz Iqbal', jurusan: 'S1 Sistem Informasi' },
      { nama: 'Muhammad Dafa Sigit', jurusan: 'S1 Teknik Elektro' },
      { nama: 'Muhammad Guntur Gamsar Sudrajat', jurusan: 'S1 Sistem Informasi' },
    ],
  },
];
