interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return <div className={['skeleton-shimmer rounded-md', className].join(' ')} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg bg-white border border-cream-200 p-5 shadow-card space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center g-page px-6 py-12">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/assets/images/logo-himasri.png"
          alt="Logo HIMASRI"
          className="h-12 w-12 object-contain"
        />
        <p className="type-small font-medium text-ink-600">Memuat Ruang Anggota HIMASRI…</p>
        <div className="w-48 space-y-2">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-2/3 mx-auto rounded-full" />
        </div>
      </div>
    </div>
  );
}
