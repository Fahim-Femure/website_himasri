import { Avatar } from './Avatar';

interface MemberRowProps {
  nama: string;
  jurusan: string;
  variant?: 'lead' | 'member';
  jabatan?: string;
  photoURL?: string | null;
}

export function MemberRow({
  nama,
  jurusan,
  variant = 'member',
  jabatan,
  photoURL,
}: MemberRowProps) {
  if (variant === 'lead') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-cream-200 border-l-[3px] border-l-maroon-700 bg-white px-4 py-3 shadow-card">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <Avatar name={nama} photoURL={photoURL} size="S" className="shrink-0 mt-0.5 sm:mt-0" />
          <div className="min-w-0 flex-1">
            <p className="type-small leading-5 font-semibold text-ink-900 break-words">
              {nama}
            </p>
            <p className="type-label leading-5 text-ink-600">{jurusan}</p>
          </div>
        </div>

        {jabatan && (
          <span className="type-label leading-5 font-medium text-ink-600 sm:text-right shrink-0">
            {jabatan}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-2 border-b border-cream-200 last:border-b-0">
      <Avatar name={nama} photoURL={photoURL} size="S" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="type-small leading-5 font-semibold text-ink-900 truncate">{nama}</p>
        <p className="type-label leading-5 text-ink-600 truncate">{jurusan}</p>
      </div>
    </div>
  );
}
