"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { slugify, type ProductCard as ProductCardData, type ShopDetail } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { Skeleton, SkeletonGrid } from "@/components/skeleton";
import { errorBoxClass } from "@/components/ui";

export function ShopClient({ slug }: { slug: string }) {
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    void fetch(`/api/v1/shops/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const message =
            body && typeof body === "object" && "error" in body
              ? String((body as { error?: { message?: string } }).error?.message)
              : "Toko belum bisa dimuat.";
          throw new Error(message);
        }
        return (await response.json()) as ShopDetail;
      })
      .then((result) => {
        setShop(result);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(caught instanceof Error ? caught.message : "Toko belum bisa dimuat.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  const groups = new Map<string, ProductCardData[]>();
  for (const product of shop?.products ?? []) {
    const key = product.etalase ?? "Semua barang";
    const current = groups.get(key) ?? [];
    current.push(product);
    groups.set(key, current);
  }

  const entries = [...groups.entries()];

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <Link
          href="/cari"
          className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
        >
          <Icon name="arrowLeft" size={18} />
          Kembali ke pencarian
        </Link>

        {loading ? (
          <div className="mt-4 space-y-4">
            <Skeleton className="h-40 w-full rounded-hero" />
            <Skeleton className="h-8 w-56" />
            <SkeletonGrid count={4} />
          </div>
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}

        {shop ? (
          <>
            <section className="mt-3 overflow-hidden rounded-hero border border-garis bg-putih">
              <div className="h-20 bg-mint" />
              <div className="px-5 pb-5">
                <div className="-mt-8 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-end gap-3">
                    <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-pil border-4 border-putih bg-mint-muda text-xl font-bold text-teal-aksi">
                      {shop.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={shop.logoUrl}
                          alt={`Logo ${shop.name}`}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        shop.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div>
                      <h1 className="font-display text-2xl font-bold text-tinta">
                        {shop.name}
                      </h1>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-tinta-lembut">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="pin" size={16} className="text-tinta-lembut" />
                          {shop.cityName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="star" size={16} className="text-perhatian" />
                          {shop.rating.toFixed(1).replace(".", ",")}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{shop.productCount} barang</span>
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex min-h-8 items-center gap-1 rounded-pil bg-mint-muda px-3 text-base font-semibold text-teal-aksi">
                    <Icon name="check" size={16} />
                    Toko aktif
                  </span>
                </div>
                {shop.description ? (
                  <p className="mt-3 text-base leading-6 text-tinta">{shop.description}</p>
                ) : null}
              </div>
            </section>

            {entries.length === 0 ? (
              <EmptyState
                icon="store"
                title="Toko ini belum punya barang"
                description="Pedagangnya mungkin sedang menyiapkan dagangan. Lihat barang lain di katalog meanwhile."
                action={{ label: "Cari barang lain", href: "/cari" }}
                className="mt-6"
              />
            ) : null}

            {entries.map(([etalase, products]) => (
              <section
                key={etalase}
                className="mt-8"
                aria-labelledby={`etalase-${slugify(etalase)}`}
              >
                <div className="flex items-center gap-3">
                  <h2
                    id={`etalase-${slugify(etalase)}`}
                    className="font-display text-2xl font-bold text-tinta"
                  >
                    {etalase}
                  </h2>
                  <span className="rounded-pil bg-abu-kartu px-3 py-1 text-base font-semibold text-tinta-lembut">
                    {products.length} barang
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
