export const JURUSAN_OPTIONS = [
  'S1 Teknik Informatika',
  'S1 Sistem Informasi',
  'S1 Teknik Elektro',
  'S1 Teknik Tenaga Listrik',
  'S1 Teknik Sistem Energi',
  'S1 Teknik Industri',
  'S1 Bisnis Energi',
  'S1 Teknik Sipil',
  'S1 Teknik Mesin',
  'D3 Teknologi Listrik',
  'Lainnya',
] as const;

export const REQUESTED_POSITION_OPTIONS = [
  'Anggota',
  'Ketua Himpunan',
  'Wakil Ketua Himpunan',
  'Sekretaris Jenderal',
  'Sekretaris',
  'Bendahara',
  'Kepala/Ketua Departemen',
  'Wakil Kepala/Ketua Departemen',
  'Kepala Biro',
  'Wakil Kepala Biro',
  'Anggota Departemen/Biro',
] as const;

export function getAngkatanOptions(baseYear = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let i = 0; i <= 7; i += 1) {
    years.push(baseYear - i);
  }
  return years;
}
