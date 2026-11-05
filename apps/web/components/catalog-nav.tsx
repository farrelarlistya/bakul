"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const navLinkClass =
  "inline-flex min-h-11 shrink-0 items-center rounded-pil px-3 text-base font-semibold text-putih/90 transition duration-cepat ease-standar hover:bg-putih/10 hover:text-putih aria-[current=page]:bg-putih/15 aria-[current=page]:text-kuning focus-visible:outline-putih";

const navClass =
  "mx-auto flex max-w-[1200px] items-center justify-center gap-1 px-4 py-1";

const items = [
  { href: "/cari", label: "Semua barang", sort: "terbaru" },
  { href: "/cari?sort=terlaris", label: "Terlaris", sort: "terlaris" },
  { href: "/cari?sort=harga-asc", label: "Termurah", sort: "harga-asc" },
] as const;

function isCatalogPath(pathname: string): boolean {
  return (
    pathname.startsWith("/cari") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/toko/")
  );
}

export function CatalogNavLinks({ activeSort }: { activeSort?: string }) {
  return (
    <nav aria-label="Jelajahi katalog" className={navClass}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={activeSort === item.sort ? "page" : undefined}
          className={navLinkClass}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function CatalogNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");
  let activeSort: string | undefined;

  if (isCatalogPath(pathname)) {
    if (currentSort === "terlaris" || currentSort === "harga-asc") {
      activeSort = currentSort;
    } else if (!currentSort || currentSort === "terbaru") {
      activeSort = "terbaru";
    }
  }

  return <CatalogNavLinks activeSort={activeSort} />;
}

export function CatalogNavFallback() {
  return <CatalogNavLinks />;
}
