import { skeletonClass } from "@/components/ui";

/**
 * Placeholder loading. Hanya berkedip lewat opacity, tanpa gradien yang
 * bergerak, supaya tetap sesuai gaya datar Bakul.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`${skeletonClass} ${className}`} />;
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={index === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-kartu border border-garis bg-putih ${className}`}
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-kartu border border-garis bg-putih p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-6 w-24 shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonGrid({
  count = 8,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

/**
 * Pembungkus status memuat. Memberi tahu pembaca layar bahwa isi sedang
 * dimuat tanpa membanjiri halaman dengan teks.
 */
export function LoadingStatus({ label }: { label: string }) {
  return (
    <p role="status" className="text-base text-tinta-lembut">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{label}</span>
    </p>
  );
}
