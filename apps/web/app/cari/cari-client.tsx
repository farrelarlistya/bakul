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
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SkeletonGrid } from "@/components/skeleton";
import {
  chipActiveClass,
  chipClass,
  errorBoxClass,
  labelClass,
  secondaryButtonClass,
  selectClass,
} from "@/components/ui";

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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    setFiltersOpen(false);
  }

  const advancedFilterCount =
    [city, maxPrice, rating].filter(Boolean).length + (sort !== "terbaru" ? 1 : 0);

  const hasFilter =
    Boolean(query.trim()) || Boolean(category) || advancedFilterCount > 0;

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader defaultQuery={query} />

      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6">
        <div>
          <p className="text-base font-semibold text-teal-aksi">Katalog</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
            {query.trim() ? `Hasil untuk “${query.trim()}”` : "Cari barang"}
          </h1>
          <p className="mt-2 text-base text-tinta-lembut" role="status">
            {data ? `${data.meta.total} barang ditemukan` : "Menyiapkan daftar barang…"}
          </p>
        </div>

        <section className="rounded-kartu border border-garis bg-putih p-4">
          <div
            role="group"
            aria-label="Pilih kategori"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            <button
              type="button"
              aria-pressed={category === ""}
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={category === "" ? chipActiveClass : chipClass}
            >
              Semua
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.slug}
                onClick={() => {
                  setCategory(item.slug);
                  setPage(1);
                }}
                className={category === item.slug ? chipActiveClass : chipClass}
              >
                {item.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="filter-lainnya"
            onClick={() => setFiltersOpen((value) => !value)}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-tombol border border-garis bg-putih px-4 text-base font-semibold text-tinta transition duration-cepat ease-standar hover:border-garis-kuat hover:bg-abu-kartu active:scale-[0.98] md:hidden"
          >
            <Icon name="sliders" size={18} />
            {filtersOpen
              ? "Tutup filter"
              : advancedFilterCount > 0
                ? `Filter lainnya (${advancedFilterCount})`
                : "Filter lainnya"}
            <Icon name={filtersOpen ? "chevronDown" : "chevronRight"} size={16} />
          </button>

          <div
            id="filter-lainnya"
            className={`${filtersOpen ? "block" : "hidden"} md:block`}
          >
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass} htmlFor="filter-city">
                  Kota
                </label>
                <select
                  id="filter-city"
                  className={selectClass}
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
                  className={selectClass}
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
                  className={selectClass}
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
                  className={selectClass}
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

            <button
              type="button"
              className={`${secondaryButtonClass} mt-4`}
              onClick={reset}
              disabled={!hasFilter}
            >
              Hapus filter
            </button>
          </div>
        </section>

        {error ? (
          <div className={errorBoxClass} role="alert">
            {error}
          </div>
        ) : null}

        {loading ? <SkeletonGrid count={8} className="md:grid-cols-4" /> : null}

        {!loading && data?.products.length === 0 ? (
          <EmptyState
            icon="search"
            title="Barang tidak ditemukan"
            description="Coba kata lain atau hapus filter yang dipakai."
          >
            <button type="button" className={secondaryButtonClass} onClick={reset}>
              Hapus filter
            </button>
          </EmptyState>
        ) : null}

        {data && data.products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        {data && data.meta.totalPages > 1 ? (
          <nav
            aria-label="Halaman hasil"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <button
              type="button"
              className={`${secondaryButtonClass} order-2 w-full sm:order-1 sm:w-auto`}
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <Icon name="chevronLeft" size={18} />
              Sebelumnya
            </button>
            <p className="order-1 text-center text-base text-tinta-lembut sm:order-2">
              Halaman {data.meta.page} dari {data.meta.totalPages}
            </p>
            <button
              type="button"
              className={`${secondaryButtonClass} order-3 w-full sm:w-auto`}
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Berikutnya
              <Icon name="chevronRight" size={18} />
            </button>
          </nav>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
