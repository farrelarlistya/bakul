import { Skeleton, SkeletonGrid } from "@/components/skeleton";

/**
 * Placeholder saat halaman berpindah. Meniru bentuk halaman katalog supaya
 * konten tidak melompat saat data arrives.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-putih">
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-9 w-64" />
        <Skeleton className="mt-6 h-44 w-full rounded-hero" />
        <div className="mt-8">
          <Skeleton className="h-7 w-40" />
          <SkeletonGrid className="mt-3" count={4} />
        </div>
      </div>
    </main>
  );
}
