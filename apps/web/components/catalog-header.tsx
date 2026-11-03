"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function CatalogHeader({ defaultQuery = "" }: { defaultQuery?: string }) {
  const { status, user } = useAuth();

  return (
    <header className="border-b border-garis bg-putih">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-display text-2xl font-bold text-tinta"
          >
            bakul
          </Link>

          <nav className="flex flex-wrap items-center gap-0.5" aria-label="Navigasi utama">
            <Link
              href="/cari"
              className="inline-flex min-h-11 items-center rounded-tombol px-2 text-base font-semibold text-teal-aksi"
            >
              Cari
            </Link>
            <Link
              href="/keranjang"
              className="inline-flex min-h-11 items-center rounded-tombol px-2 text-base font-semibold text-teal-aksi"
            >
              Keranjang
            </Link>
            <Link
              href="/pesanan"
              className="inline-flex min-h-11 items-center rounded-tombol px-2 text-base font-semibold text-teal-aksi"
            >
              Pesanan
            </Link>
            <Link
              href="/inbox"
              className="inline-flex min-h-11 items-center rounded-tombol px-2 text-base font-semibold text-teal-aksi"
            >
              Inbox
            </Link>
            {status === "masuk" && user ? (
              <Link
                href="/akun"
                className="inline-flex min-h-11 max-w-28 items-center truncate rounded-tombol bg-krem px-2 text-base font-semibold text-tinta"
              >
                {user.name.split(" ")[0]}
              </Link>
            ) : (
              <Link
                href="/masuk"
                className="inline-flex min-h-11 items-center rounded-tombol bg-teal-aksi px-3 text-base font-semibold text-putih"
              >
                Masuk
              </Link>
            )}
          </nav>
        </div>

        <form action="/cari" method="get" className="mt-2 flex gap-2">
          <label htmlFor="catalog-search" className="sr-only">
            Cari barang
          </label>
          <input
            id="catalog-search"
            name="q"
            type="search"
            defaultValue={defaultQuery}
            placeholder="Cari nastar, batik, kopi…"
            className="min-h-11 w-full rounded-tombol border border-garis bg-abu-kartu px-4 text-base text-tinta outline-none focus:border-teal-aksi focus:ring-2 focus:ring-mint"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 shrink-0 items-center rounded-tombol bg-teal-aksi px-5 text-base font-semibold text-putih"
          >
            Cari
          </button>
        </form>
      </div>
    </header>
  );
}
