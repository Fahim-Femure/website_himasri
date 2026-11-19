import { useEffect, useMemo, useState } from 'react';
import { FALLBACK_FACULTIES, subscribeFaculties } from '@/services/cmsService';
import type { FacultyDoc } from '@/types/models';

export function useFaculties() {
  const [faculties, setFaculties] = useState<FacultyDoc[]>(FALLBACK_FACULTIES);

  useEffect(() => {
    return subscribeFaculties(setFaculties);
  }, []);

  const facultyNames = useMemo(() => faculties.map((f) => f.name), [faculties]);

  const getLabsForFaculty = (facultyName: string): string[] => {
    const found = faculties.find((f) => f.name === facultyName);
    return found ? found.labs : [];
  };

  return { faculties, facultyNames, getLabsForFaculty };
}
