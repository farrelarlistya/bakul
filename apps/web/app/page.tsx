import Link from "next/link";
import type { CatalogPage, CategorySummary } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

const API = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001";

async function getJson<T>(pathname: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}${pathname}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function Page() {
  const [categories, products] = await Promise.all([
    getJson<CategorySummary[]>("/api/v1/categories"),
    getJson<CatalogPage>("/api/v1/products?sort=terlaris&limit=4"),
  ]);

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <CatalogHeader />

      <section className="bg-mint">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-14">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Pasar untuk UMKM</p>
            <h1 className="mt-2 max-w-xl font-display text-[32px] font-bold leading-10 text-tinta md:text-4xl">
              Dukung UMKM sekitarmu.
            </h1>
            <p className="mt-3 max-w-xl text-lg leading-7 text-tinta">
              Barang dari pedagang kecil, dengan uang yang aman sampai barang tiba.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#produk"
                className="inline-flex min-h-11 items-center rounded-tombol bg-teal-aksi px-5 text-base font-semibold text-putih"
              >
                Mulai belanja
              </a>
              <Link
                href="/jualan"
                className="inline-flex min-h-11 items-center rounded-tombol border border-teal-aksi bg-putih px-5 text-base font-semibold text-teal-aksi"
              >
                Buka toko
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-hero bg-putih">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gambar/hero.webp"
              alt="Tas anyaman buatan pedagang UMKM"
              width={600}
              height={450}
              loading="eager"
              className="h-56 w-full object-cover md:h-72"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        <section aria-label="Janji Bakul" className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-lg font-semibold text-tinta">Uang ditahan aman</p>
            <p className="mt-1 text-base text-tinta-lembut">
              Dana diteruskan ke penjual setelah barang diterima.
            </p>
          </div>
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-lg font-semibold text-tinta">Bantuan komplain</p>
            <p className="mt-1 text-base text-tinta-lembut">
              Kalau barang tidak sesuai, ajukan komplain dari halaman pesanan.
            </p>
          </div>
        </section>

        <section aria-labelledby="kategori">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-teal-aksi">Jelajahi</p>
              <h2 id="kategori" className="font-display text-2xl font-bold text-tinta">
                Kategori
              </h2>
            </div>
            <Link
              href="/cari"
              className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi"
            >
              Lihat semua
            </Link>
          </div>

          {categories ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/cari?category=${encodeURIComponent(category.slug)}`}
                  className="flex min-h-24 min-w-28 flex-col justify-between rounded-hero bg-krem p-3 text-tinta"
                >
                  <span className="text-2xl font-bold text-teal-aksi">
                    {category.name.slice(0, 1)}
                  </span>
                  <span className="text-base font-semibold leading-5">{category.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-base text-tinta-lembut">Kategori belum bisa dimuat.</p>
          )}
        </section>

        <section id="produk" aria-labelledby="laris">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-teal-aksi">Pilihan pembeli</p>
              <h2 id="laris" className="font-display text-2xl font-bold text-tinta">
                Sedang laris
              </h2>
            </div>
            <Link
              href="/cari?sort=terlaris"
              className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi"
            >
              Lihat semua
            </Link>
          </div>

          {products && products.products.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {products.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-kartu border border-garis bg-abu-kartu p-5">
              <p className="text-base text-tinta-lembut">
                Katalog belum bisa dimuat. Pastikan API dan PostgreSQL hidup, lalu muat
                ulang halaman ini.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-hero bg-krem p-5 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-tinta">
              Punya dagangan? Buka toko gratis.
            </h2>
            <p className="mt-2 max-w-xl text-base leading-6 text-tinta">
              Cukup nomor HP. Tanpa email, tanpa KTP. Barang pertama bisa langsung
              diunggah.
            </p>
          </div>
          <Link
            href="/jualan"
            className="mt-4 inline-flex min-h-11 items-center rounded-tombol bg-teal-aksi px-5 text-base font-semibold text-putih md:mt-0 md:shrink-0"
          >
            Mulai jualan
          </Link>
        </section>
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
