"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PRODUCT_SORTS,
  WILAYAH,
  type CatalogPage,
  type CategorySummary,
  type ProductSort,
} from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { errorBoxClass, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";

const SORT_LABEL: Record<ProductSort, string> = {
  terbaru: "Terbaru",
  terlaris: "Terlaris",
  "harga-asc": "Harga terendah",
  "harga-desc": "Harga tertinggi",
};

export function CariClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [rating, setRating] = useState(searchParams.get("rating") ?? "");
  const [sort, setSort] = useState<ProductSort>(
    (PRODUCT_SORTS as readonly string[]).includes(searchParams.get("sort") ?? "")
      ? (searchParams.get("sort") as ProductSort)
      : "terbaru",
  );
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [data, setData] = useState<CatalogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setCity(searchParams.get("city") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
    setRating(searchParams.get("rating") ?? "");
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    let alive = true;

    void fetch("/api/v1/categories")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items: CategorySummary[]) => {
        if (alive) {
          setCategories(items);
        }
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (rating) params.set("rating", rating);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");

    setLoading(true);
    setError(null);

    void fetch(`/api/v1/products?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const message =
            body && typeof body === "object" && "error" in body
              ? String((body as { error?: { message?: string } }).error?.message)
              : "Pencarian belum bisa dimuat.";
          throw new Error(message);
        }
        return (await response.json()) as CatalogPage;
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(caught instanceof Error ? caught.message : "Pencarian belum bisa dimuat.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [query, category, city, maxPrice, rating, sort, page]);

  function reset(): void {
    setQuery("");
    setCategory("");
    setCity("");
    setMaxPrice("");
    setRating("");
    setSort("terbaru");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <CatalogHeader defaultQuery={query} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <p className="text-base font-semibold text-teal-aksi">Katalog</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
            {query.trim() ? `Hasil untuk “${query.trim()}”` : "Cari barang"}
          </h1>
          <p className="mt-2 text-base text-tinta-lembut">
            {data ? `${data.meta.total} barang ditemukan` : "Menyiapkan daftar barang…"}
          </p>
        </div>

        <section className="rounded-kartu border border-garis bg-putih p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={`inline-flex min-h-11 items-center rounded-pil px-4 text-base font-semibold ${
                category === "" ? "bg-teal-aksi text-putih" : "bg-abu-kartu text-tinta"
              }`}
            >
              Semua
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategory(item.slug);
                  setPage(1);
                }}
                className={`inline-flex min-h-11 items-center rounded-pil px-4 text-base font-semibold ${
                  category === item.slug
                    ? "bg-teal-aksi text-putih"
                    : "bg-abu-kartu text-tinta"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass} htmlFor="filter-city">
                Kota
              </label>
              <select
                id="filter-city"
                className={inputClass}
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua kota</option>
                {WILAYAH.map((item) => (
                  <option key={item.cityId} value={item.cityName}>
                    {item.cityName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="filter-price">
                Harga maksimal
              </label>
              <select
                id="filter-price"
                className={inputClass}
                value={maxPrice}
                onChange={(event) => {
                  setMaxPrice(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua harga</option>
                <option value="25000">Rp 25.000</option>
                <option value="50000">Rp 50.000</option>
                <option value="100000">Rp 100.000</option>
                <option value="200000">Rp 200.000</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="filter-rating">
                Rating
              </label>
              <select
                id="filter-rating"
                className={inputClass}
                value={rating}
                onChange={(event) => {
                  setRating(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua rating</option>
                <option value="4.5">4,5 ke atas</option>
                <option value="4.8">4,8 ke atas</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="filter-sort">
                Urutkan
              </label>
              <select
                id="filter-sort"
                className={inputClass}
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as ProductSort);
                  setPage(1);
                }}
              >
                {PRODUCT_SORTS.map((value) => (
                  <option key={value} value={value}>
                    {SORT_LABEL[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" className={`${secondaryButtonClass} mt-4`} onClick={reset}>
            Hapus filter
          </button>
        </section>

        {error ? (
          <div className={errorBoxClass} role="alert">
            {error}
          </div>
        ) : null}

        {loading ? <p className="text-base text-tinta-lembut">Memuat barang…</p> : null}

        {!loading && data?.products.length === 0 ? (
          <div className="rounded-kartu border border-garis bg-abu-kartu p-6 text-center">
            <p className="text-lg font-semibold text-tinta">Barang tidak ditemukan.</p>
            <p className="mt-1 text-base text-tinta-lembut">
              Coba kata lain atau hapus filter.
            </p>
            <button type="button" className={`${secondaryButtonClass} mt-4`} onClick={reset}>
              Hapus filter
            </button>
          </div>
        ) : null}

        {data && data.products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        {data && data.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Sebelumnya
            </button>
            <p className="text-base text-tinta-lembut">
              Halaman {data.meta.page} dari {data.meta.totalPages}
            </p>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Berikutnya
            </button>
          </div>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
