"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { slugify, type ProductCard as ProductCardData, type ShopDetail } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
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

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <CatalogHeader />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link
          href="/cari"
          className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi"
        >
          ← Kembali ke pencarian
        </Link>

        {loading ? <p className="mt-4 text-base text-tinta-lembut">Memuat toko…</p> : null}
        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}

        {shop ? (
          <>
            <section className="mt-3 overflow-hidden rounded-hero bg-mint">
              <div className="h-20 bg-mint" />
              <div className="bg-putih px-5 pb-5">
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
                      <p className="text-base text-tinta-lembut">
                        {shop.cityName} · ★ {shop.rating.toFixed(1).replace(".", ",")} ·{" "}
                        {shop.productCount} barang
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-tinta-lembut">Toko aktif</p>
                </div>
                {shop.description ? (
                  <p className="mt-3 text-base leading-6 text-tinta">{shop.description}</p>
                ) : null}
              </div>
            </section>

            {groups.size === 0 ? (
              <div className="mt-6 rounded-kartu border border-garis bg-abu-kartu p-5">
                <p className="text-base text-tinta-lembut">Toko ini belum punya barang.</p>
              </div>
            ) : null}

            {[...groups.entries()].map(([etalase, products]) => (
              <section
                key={etalase}
                className="mt-8"
                aria-labelledby={`etalase-${slugify(etalase)}`}
              >
                <h2
                  id={`etalase-${slugify(etalase)}`}
                  className="font-display text-2xl font-bold text-tinta"
                >
                  {etalase}
                </h2>
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
