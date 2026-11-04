import Link from "next/link";
import {
  formatRupiah,
  type CatalogPage,
  type CategorySummary,
} from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { HomeGreeting } from "@/components/home-greeting";
import { HomeProductCard } from "@/components/home-product-card";
import { HomeShopCard, type HomeShop } from "@/components/home-shop-card";
import { Icon, categoryIcon } from "@/components/icon";
import { SiteFooter } from "@/components/site-footer";
import { Skeleton, SkeletonGrid } from "@/components/skeleton";

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

const categoryTints = [
  "bg-kuning-pastel",
  "bg-mint-pastel",
  "bg-lavender",
  "bg-biru-pastel",
  "bg-kuning-pastel",
  "bg-biru-pastel",
  "bg-mint-pastel",
  "bg-lavender",
];

const sortLinks = [
  { href: "/cari?sort=terbaru", label: "Terbaru" },
  { href: "/cari?sort=harga-asc", label: "Termurah" },
  { href: "/cari?sort=harga-desc", label: "Termahal" },
];

export default async function Page() {
  const [categories, products, newest] = await Promise.all([
    getJson<CategorySummary[]>("/api/v1/categories"),
    getJson<CatalogPage>("/api/v1/products?sort=terlaris&limit=16"),
    getJson<CatalogPage>("/api/v1/products?sort=terbaru&limit=8"),
  ]);

  const featured = products?.products[0] ?? null;
  const orbs = products?.products.slice(1, 4) ?? [];

  const bestIds = new Set((products?.products ?? []).map((product) => product.id));
  const freshProducts = (newest?.products ?? []).filter(
    (product) => !bestIds.has(product.id),
  );
  const newArrivals = freshProducts.slice(0, 4);

  const shopSource = [...(products?.products ?? []), ...(newest?.products ?? [])];
  const shops: HomeShop[] = [];
  const seenShops = new Set<string>();

  for (const product of shopSource) {
    if (seenShops.has(product.shopSlug)) {
      continue;
    }

    seenShops.add(product.shopSlug);
    shops.push({
      slug: product.shopSlug,
      name: product.shopName,
      city: product.city,
      imageUrl: product.imageUrl,
    });

    if (shops.length === 4) {
      break;
    }
  }

  const cities = [...new Set(shopSource.map((product) => product.city))].slice(0, 6);

  return (
    <main className="min-h-screen bg-krem-halaman pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-[1200px] px-4 pt-3 md:pt-6">
        <form
          action="/cari"
          method="get"
          role="search"
          aria-label="Cari barang"
          className="flex gap-2 md:hidden"
        >
          <div className="pencarian-pil flex min-h-12 flex-1 items-center gap-2 rounded-pil border-2 border-garis-hangat bg-putih px-4 transition duration-cepat ease-standar focus-within:border-hutan">
            <Icon
              name="search"
              size={20}
              className="shrink-0 text-tinta-lembut"
            />
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
          </div>
          <button
            type="submit"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-pil bg-hutan px-4 text-base font-semibold text-putih transition duration-cepat ease-standar hover:bg-hutan-tua active:scale-95 focus-visible:outline-hutan"
          >
            Cari
          </button>
        </form>

        <section
          aria-labelledby="hero-title"
          className="mt-3 grid gap-3 md:mt-0 md:grid-cols-12 md:gap-4"
        >
          <div className="relative overflow-hidden rounded-panel bg-lavender p-5 md:col-span-8 md:min-h-[300px] md:p-8">
            <HomeGreeting className="text-base font-semibold text-hutan" />
            <h1
              id="hero-title"
              className="mt-2 max-w-[15ch] font-display text-[30px] font-bold leading-[1.12] text-tinta md:max-w-[34rem] md:text-[44px]"
            >
              Belanja dari tetangga, sampai ke rumah.
            </h1>
            <p className="mt-3 max-w-[34ch] text-base leading-6 text-tinta/80 md:max-w-[26rem]">
              Barang harian dari pedagang kecil di sekitar Anda, dengan harga
              yang jujur.
            </p>
            <Link
              href="/cari"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-pil bg-hutan px-5 text-base font-semibold text-putih transition duration-cepat ease-standar hover:bg-hutan-tua active:scale-[0.98] focus-visible:outline-hutan"
            >
              Mulai belanja
              <Icon name="arrowRight" size={18} />
            </Link>

            {orbs.length > 0 ? (
              <div className="mt-5 flex items-center -space-x-3 md:absolute md:bottom-7 md:right-7 md:mt-0">
                {orbs.map((product) => (
                  <span
                    key={product.id}
                    className="relative inline-flex h-14 w-14 shrink-0 overflow-hidden rounded-pil border-[3px] border-putih bg-putih md:h-[76px] md:w-[76px]"
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        width={152}
                        height={152}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-hutan">
                        <Icon name="basket" size={24} />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col rounded-panel bg-mint-pastel p-3 md:col-span-4 md:row-span-2 md:p-4">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-base font-semibold text-hutan">Lagi laris</p>
              <Link
                href="/cari?sort=terlaris"
                aria-label="Lihat semua barang terlaris"
                className="inline-flex min-h-11 items-center gap-1 rounded-pil px-2 text-base font-semibold text-hutan transition duration-cepat ease-standar hover:bg-putih/60 focus-visible:outline-hutan"
              >
                <span className="hidden lg:inline">Lihat semua</span>
                <Icon name="chevronRight" size={18} />
              </Link>
            </div>

            {featured ? (
              <Link
                href={`/p/${featured.slug}`}
                className="group mt-1 flex flex-1 flex-col rounded-kartu-besar focus-visible:outline-hutan"
              >
                <div className="relative min-h-[180px] flex-1 overflow-hidden rounded-kartu-besar bg-putih md:min-h-[220px]">
                  {featured.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.imageUrl}
                      alt={featured.name}
                      width={480}
                      height={360}
                      loading="eager"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-hutan">
                      <Icon name="basket" size={32} />
                    </span>
                  )}
                </div>
                <div className="px-1 pb-1 pt-3">
                  <p className="line-clamp-2 text-base font-semibold leading-5 text-tinta">
                    {featured.name}
                  </p>
                  <div className="mt-1 flex min-w-0 items-center gap-1 text-base text-tinta-lembut">
                    <Icon
                      name="star"
                      size={14}
                      className="shrink-0 text-perhatian"
                    />
                    <span className="shrink-0">
                      {featured.rating.toFixed(1).replace(".", ",")}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{featured.city}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-tinta">
                    {formatRupiah(featured.price)}
                  </p>
                  <span className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-pil bg-putih px-3 text-base font-semibold text-hutan transition duration-cepat ease-standar group-hover:bg-hutan group-hover:text-putih">
                    Lihat barang
                    <Icon name="arrowRight" size={16} />
                  </span>
                </div>
              </Link>
            ) : (
              <Skeleton className="mt-1 min-h-[220px] w-full rounded-kartu-besar md:flex-1" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:col-span-8">
            <Link
              href="/cari"
              className="flex min-h-[148px] flex-col justify-between rounded-panel border border-transparent bg-kuning-pastel p-4 transition duration-cepat ease-standar hover:border-hutan/30 active:scale-[0.99] focus-visible:outline-hutan md:p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-pil bg-putih/80 text-hutan">
                <Icon name="basket" size={22} />
              </span>
              <span className="mt-4 block">
                <span className="block font-display text-xl font-bold text-tinta">
                  Semua kategori
                </span>
                <span className="mt-1 flex items-center gap-1 text-base text-tinta/80">
                  {categories ? `${categories.length} kategori` : "8 kategori"}
                  <Icon name="chevronRight" size={16} />
                </span>
              </span>
            </Link>

            <Link
              href="/lacak"
              className="flex min-h-[148px] flex-col justify-between rounded-panel border border-transparent bg-biru-pastel p-4 transition duration-cepat ease-standar hover:border-hutan/30 active:scale-[0.99] focus-visible:outline-hutan md:p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-pil bg-putih/80 text-hutan">
                <Icon name="truck" size={22} />
              </span>
              <span className="mt-4 block">
                <span className="block font-display text-xl font-bold text-tinta">
                  Lacak pesanan
                </span>
                <span className="mt-1 flex items-center gap-1 text-base text-tinta/80">
                  Lihat posisi kiriman
                  <Icon name="chevronRight" size={16} />
                </span>
              </span>
            </Link>
          </div>
        </section>
      </div>

      <section
        id="kategori"
        aria-labelledby="kategori-title"
        className="mx-auto mt-8 max-w-[1200px] scroll-mt-24 px-4 md:mt-10 md:scroll-mt-[132px]"
      >
        <div className="text-center">
          <p className="text-base font-semibold text-hutan">Jelajahi</p>
          <h2
            id="kategori-title"
            className="mt-1 font-display text-2xl font-bold text-tinta md:text-3xl"
          >
            Belanja sesuai kategori
          </h2>
          <p className="mt-2 text-base text-tinta-lembut">
            Dari kue kering sampai kerajinan tangan.
          </p>
        </div>

        {categories ? (
          <ul className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:pb-0 lg:grid-cols-8">
            {categories.map((category, index) => (
              <li
                key={category.id}
                className="w-[112px] shrink-0 snap-start md:w-auto"
              >
                <Link
                  href={`/cari?category=${encodeURIComponent(category.slug)}`}
                  className="flex h-full min-h-[128px] flex-col items-center justify-center gap-2 rounded-kartu-besar border border-garis-hangat bg-putih p-3 text-center transition duration-cepat ease-standar hover:border-hutan/40 hover:bg-krem-terang active:scale-[0.98] focus-visible:outline-hutan"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-pil text-hutan ${
                      categoryTints[index % categoryTints.length]
                    }`}
                  >
                    <Icon name={categoryIcon(category.slug)} size={26} />
                  </span>
                  <span className="line-clamp-2 text-base font-semibold leading-5 text-tinta">
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="mt-5 grid grid-cols-4 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-8"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="min-h-[128px] w-full rounded-kartu-besar"
              />
            ))}
          </div>
        )}
      </section>

      {shops.length > 0 ? (
        <section
          aria-labelledby="toko-title"
          className="mt-8 bg-mint-pastel md:mt-12"
        >
          <div className="mx-auto max-w-[1200px] px-4 py-9 md:py-12">
            <div>
              <p className="text-base font-semibold text-hutan">Kenalan dulu</p>
              <h2
                id="toko-title"
                className="mt-1 font-display text-2xl font-bold text-tinta md:text-3xl"
              >
                Toko pilihan
              </h2>
              <p className="mt-2 max-w-xl text-base leading-6 text-tinta/80">
                Kenali pedagang di balik barang yang kamu lihat.
              </p>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {shops.map((shop) => (
                <li key={shop.slug}>
                  <HomeShopCard shop={shop} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <section
          aria-labelledby="baru-title"
          className="mt-8 bg-krem md:mt-12"
        >
          <div className="mx-auto max-w-[1200px] px-4 py-9 md:py-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-hutan">Baru datang</p>
                <h2
                  id="baru-title"
                  className="mt-1 font-display text-2xl font-bold text-tinta md:text-3xl"
                >
                  Baru di Bakul
                </h2>
                <p className="mt-2 max-w-xl text-base leading-6 text-tinta/80">
                  Barang yang baru diunggah pedagang sekitar.
                </p>
              </div>
              <Link
                href="/cari?sort=terbaru"
                className="inline-flex min-h-11 items-center gap-2 rounded-pil border border-hutan/30 px-4 text-base font-semibold text-hutan transition duration-cepat ease-standar hover:bg-mint-muda focus-visible:outline-hutan"
              >
                Lihat semua
                <Icon name="chevronRight" size={18} />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section
        id="produk"
        aria-labelledby="produk-title"
        className="mt-8 scroll-mt-24 bg-hutan md:mt-12 md:scroll-mt-[132px]"
      >
        <div className="mx-auto max-w-[1200px] px-4 py-9 md:py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-kuning">
                Pilihan pembeli
              </p>
              <h2
                id="produk-title"
                className="mt-1 font-display text-2xl font-bold text-putih md:text-4xl"
              >
                Lagi laris
              </h2>
              <p className="mt-2 max-w-xl text-base leading-6 text-putih/75">
                Pilihan barang dari pedagang lokal, siap dikirim ke rumah Anda.
              </p>
            </div>
            <Link
              href="/cari?sort=terlaris"
              className="inline-flex min-h-11 items-center gap-2 rounded-pil border border-putih/30 px-4 text-base font-semibold text-putih transition duration-cepat ease-standar hover:bg-putih/10 focus-visible:outline-putih"
            >
              Lihat semua
              <Icon name="chevronRight" size={18} />
            </Link>
          </div>

          <nav
            aria-label="Urutkan barang"
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
          >
            <span className="inline-flex min-h-11 shrink-0 items-center rounded-pil bg-kuning px-4 text-base font-semibold text-tinta">
              Terlaris
            </span>
            {sortLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 shrink-0 items-center rounded-pil border border-putih/30 px-4 text-base font-semibold text-putih transition duration-cepat ease-standar hover:bg-putih/10 focus-visible:outline-putih"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {products && products.products.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {products.products.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : products ? (
            <div className="mt-4 flex flex-col items-center rounded-panel bg-putih px-5 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-pil bg-kuning-pastel text-hutan">
                <Icon name="basket" size={28} />
              </span>
              <p className="mt-4 font-display text-xl font-bold text-tinta">
                Belum ada barang yang bisa ditampilkan.
              </p>
              <p className="mt-1 max-w-md text-base text-tinta-lembut">
                Coba buka katalog lengkap atau pilih kategori lain.
              </p>
              <Link
                href="/cari"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-pil bg-hutan px-5 text-base font-semibold text-putih transition duration-cepat ease-standar hover:bg-hutan-tua focus-visible:outline-hutan"
              >
                Buka katalog
                <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <SkeletonGrid count={16} />
            </div>
          )}
        </div>
      </section>

      {cities.length > 0 ? (
        <section
          aria-labelledby="kota-title"
          className="mx-auto mt-8 max-w-[1200px] px-4 md:mt-12"
        >
          <div className="rounded-panel bg-putih p-5 md:p-8">
            <div className="md:grid md:grid-cols-[0.9fr_1.5fr] md:items-center md:gap-8">
              <div>
                <p className="text-base font-semibold text-hutan">Sekitar kamu</p>
                <h2
                  id="kota-title"
                  className="mt-1 font-display text-2xl font-bold text-tinta md:text-3xl"
                >
                  Jelajahi kota
                </h2>
                <p className="mt-2 max-w-md text-base leading-6 text-tinta/80">
                  Barang dari pedagang di kota lain, langsung ke rumah.
                </p>
                <Link
                  href="/cari"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-pil bg-hutan px-5 text-base font-semibold text-putih transition duration-cepat ease-standar hover:bg-hutan-tua focus-visible:outline-hutan"
                >
                  Buka katalog
                  <Icon name="arrowRight" size={18} />
                </Link>
              </div>

              <ul className="mt-5 flex flex-wrap gap-2 md:mt-0 md:justify-end">
                {cities.map((city) => (
                  <li key={city}>
                    <Link
                      href={`/cari?city=${encodeURIComponent(city)}`}
                      className="inline-flex min-h-12 items-center gap-2 rounded-pil border border-garis bg-krem-terang px-4 text-base font-semibold text-tinta transition duration-cepat ease-standar hover:border-hutan hover:bg-mint-muda active:scale-[0.98] focus-visible:outline-hutan"
                    >
                      <Icon name="pin" size={16} className="shrink-0 text-hutan" />
                      {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="jualan-title"
        className="mx-auto mt-8 max-w-[1200px] px-4 md:mt-12"
      >
        <div className="overflow-hidden rounded-panel bg-kuning-pastel">
          <div className="grid md:h-[260px] md:grid-cols-[1.3fr_1fr]">
            <div className="p-5 md:p-8">
              <p className="text-base font-semibold text-hutan">Untuk penjual</p>
              <h2
                id="jualan-title"
                className="mt-1 font-display text-2xl font-bold leading-tight text-tinta md:text-3xl"
              >
                Punya dagangan? Buka toko gratis.
              </h2>
              <p className="mt-2 max-w-xl text-base leading-6 text-tinta/80">
                Cukup nomor HP. Tanpa email, tanpa KTP. Barang pertama bisa
                langsung diunggah.
              </p>
              <Link
                href="/jualan"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-pil bg-hutan px-5 text-base font-semibold text-putih transition duration-cepat ease-standar hover:bg-hutan-tua active:scale-[0.98] focus-visible:outline-hutan"
              >
                Mulai jualan
                <Icon name="arrowRight" size={18} />
              </Link>
            </div>
            <div className="relative order-first h-44 md:order-last md:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gambar/hero.webp"
                alt="Tas anyaman buatan pedagang UMKM"
                width={600}
                height={450}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
