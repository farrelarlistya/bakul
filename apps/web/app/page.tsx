import Link from "next/link";
import type { CatalogPage, CategorySummary } from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { HomeGreeting } from "@/components/home-greeting";
import { HomeProductCard } from "@/components/home-product-card";
import { Icon, categoryIcon } from "@/components/icon";
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

function SectionHeading({
  eyebrow,
  title,
  id,
  href,
}: {
  eyebrow: string;
  title: string;
  id: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-teal-aksi">{eyebrow}</p>
        <h2 id={id} className="font-display text-2xl font-bold text-tinta">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        aria-label={`Lihat semua ${title.toLowerCase()}`}
        className="inline-flex min-h-11 items-center gap-1 text-base font-semibold text-teal-aksi"
      >
        Lihat semua
        <Icon name="chevronRight" size={16} />
      </Link>
    </div>
  );
}

export default async function Page() {
  const [categories, products] = await Promise.all([
    getJson<CategorySummary[]>("/api/v1/categories"),
    getJson<CatalogPage>("/api/v1/products?sort=terlaris&limit=4"),
  ]);

  const categoryTints = [
    "bg-mint-muda",
    "bg-krem",
    "bg-abu-kartu",
    "bg-mint-muda",
    "bg-abu-kartu",
    "bg-krem",
    "bg-mint-muda",
    "bg-abu-kartu",
  ];

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader />

      <div className="bg-tinta text-mint">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
          <Icon name="shield" size={18} className="shrink-0" />
          <p className="text-base leading-6">Uang ditahan aman sampai barang diterima</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-7 px-4 py-5">
        <section aria-labelledby="sapaan">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-teal-aksi">Pasar untuk UMKM</p>
              <HomeGreeting />
              <p className="mt-1 text-base leading-6 text-tinta-lembut">
                Mau belanja apa hari ini?
              </p>
            </div>
            <span className="hidden h-14 w-14 items-center justify-center rounded-pil bg-mint-muda text-teal-aksi md:flex">
              <Icon name="basket" size={28} />
            </span>
          </div>

          <form action="/cari" method="get" role="search" aria-label="Cari barang" className="mt-3 flex gap-2 md:hidden">
            <div className="flex min-h-12 flex-1 items-center gap-2 rounded-tombol border border-garis bg-abu-kartu px-3">
              <Icon name="search" size={20} className="shrink-0 text-tinta-lembut" />
              <label htmlFor="home-search" className="sr-only">
                Cari barang
              </label>
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder="Cari nastar, kopi, batik..."
                className="min-h-11 w-full bg-transparent text-base text-tinta outline-none placeholder:text-tinta-lembut"
              />
              <button type="submit" className="sr-only">
                Cari
              </button>
            </div>
            <Link
              href="/cari"
              aria-label="Buka pencarian dan filter"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-tombol bg-teal-aksi text-putih"
            >
              <Icon name="sliders" size={22} />
            </Link>
          </form>
        </section>

        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden rounded-hero bg-mint"
        >
          <div className="flex h-[200px] items-stretch md:h-[300px]">
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between p-4 md:p-8">
              <div className="max-w-[13rem] md:max-w-xl">
                <p className="text-base font-semibold text-teal-tua">Pedagang lokal</p>
                <h2
                  id="hero-title"
                  className="mt-1 font-display text-[18px] font-bold leading-6 text-tinta md:text-4xl md:leading-tight"
                >
                  Belanja dari tetangga, sampai ke rumah.
                </h2>
                <p className="mt-3 hidden max-w-md text-base leading-6 text-tinta md:block">
                  Barang dari pedagang kecil, dengan uang yang aman sampai tiba.
                </p>
              </div>
              <a
                href="#kategori"
                className="mt-3 inline-flex min-h-11 w-fit items-center gap-2 rounded-tombol bg-teal-aksi px-3 text-base font-semibold text-putih"
              >
                Jelajahi kategori
                <Icon name="chevronRight" size={16} />
              </a>
            </div>
            <div className="relative w-[36%] min-w-[110px] shrink-0 overflow-hidden md:w-[40%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gambar/hero.webp"
                alt="Tas anyaman buatan pedagang UMKM"
                width={600}
                height={450}
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section aria-label="Janji Bakul" className="grid grid-cols-2 gap-3">
          <div className="flex min-h-20 items-start gap-3 rounded-kartu border border-garis bg-putih p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tombol bg-mint-muda text-teal-aksi">
              <Icon name="shield" size={22} />
            </span>
            <div>
              <p className="text-base font-semibold text-tinta">Uang aman</p>
              <p className="mt-0.5 text-base leading-5 text-tinta-lembut">
                Sampai barang tiba
              </p>
            </div>
          </div>
          <div className="flex min-h-20 items-start gap-3 rounded-kartu border border-garis bg-putih p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tombol bg-krem text-perhatian">
              <Icon name="chat" size={22} />
            </span>
            <div>
              <p className="text-base font-semibold text-tinta">Komplain</p>
              <p className="mt-0.5 text-base leading-5 text-tinta-lembut">
                Admin bantu
              </p>
            </div>
          </div>
        </section>

        <section id="kategori" aria-labelledby="kategori-title" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Jelajahi"
            title="Kategori"
            id="kategori-title"
            href="/cari"
          />

          {categories ? (
            <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-8">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/cari?category=${encodeURIComponent(category.slug)}`}
                  className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-kartu border border-transparent p-2 text-center transition-colors hover:border-teal-aksi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-aksi focus-visible:ring-offset-2 ${
                    categoryTints[index % categoryTints.length]
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-tombol bg-putih text-teal-aksi">
                    <Icon name={categoryIcon(category.slug)} size={22} />
                  </span>
                  <span className="line-clamp-2 text-base font-semibold leading-5 text-tinta">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-kartu border border-garis bg-abu-kartu p-4 text-base text-tinta-lembut">
              Kategori belum bisa dimuat. Coba muat ulang halaman ini.
            </p>
          )}
        </section>

        <section id="produk" aria-labelledby="produk-title" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Pilihan pembeli"
            title="Lagi laris"
            id="produk-title"
            href="/cari?sort=terlaris"
          />

          {products && products.products.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {products.products.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-kartu border border-garis bg-abu-kartu p-5">
              <p className="text-base text-tinta-lembut">
                Katalog belum bisa dimuat. Coba muat ulang halaman ini.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-hero bg-krem p-5 md:flex md:items-center md:justify-between md:gap-6">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-tombol bg-putih text-teal-aksi">
              <Icon name="store" size={26} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold text-tinta">
                Punya dagangan? Buka toko gratis.
              </h2>
              <p className="mt-1 max-w-xl text-base leading-6 text-tinta">
                Cukup nomor HP. Tanpa email, tanpa KTP. Barang pertama bisa langsung
                diunggah.
              </p>
            </div>
          </div>
          <Link
            href="/jualan"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-tombol bg-teal-aksi px-5 text-base font-semibold text-putih md:mt-0 md:shrink-0"
          >
            Mulai jualan
            <Icon name="arrowRight" size={18} />
          </Link>
        </section>
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
