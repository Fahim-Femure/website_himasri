export interface FacultyLabs {
  fakultas: string;
  labs: readonly string[];
}

/**
 * Daftar contoh fakultas & laboratorium IT PLN.
 * Wajib dikonfirmasi oleh pengurus HIMASRI sebelum rilis resmi.
 */
export const FACULTIES_AND_LABS: readonly FacultyLabs[] = [
  {
    fakultas: 'Fakultas Telematika Energi',
    labs: [
      'Lab Pemrograman Dasar',
      'Lab Basis Data',
      'Lab Jaringan Komputer',
      'Lab Rekayasa Perangkat Lunak',
    ],
  },
  {
    fakultas: 'Fakultas Ketenagalistrikan dan Energi Terbarukan',
    labs: [
      'Lab Sistem Tenaga',
      'Lab Elektronika Dasar',
      'Lab Sistem Digital',
      'Lab Konversi Energi',
    ],
  },
  {
    fakultas: 'Fakultas Teknologi dan Bisnis Energi',
    labs: ['Lab Analisis Sistem', 'Lab Bisnis Energi', 'Lab Teknik Industri'],
  },
  {
    fakultas: 'Fakultas Teknologi Infrastruktur dan Kewilayahan',
    labs: ['Lab Teknik Sipil', 'Lab Teknik Mesin'],
  },
] as const;

export const FAKULTAS_OPTIONS = FACULTIES_AND_LABS.map((item) => item.fakultas);

export function getLabsByFakultas(fakultas: string): readonly string[] {
  const found = FACULTIES_AND_LABS.find((item) => item.fakultas === fakultas);
  return found ? found.labs : [];
}
