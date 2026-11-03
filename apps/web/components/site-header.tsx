"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { status, user } = useAuth();

  return (
    <header className="border-b border-garis bg-putih">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-2xl font-bold text-tinta"
        >
          bakul
        </Link>

        <nav className="flex flex-wrap items-center gap-0.5" aria-label="Navigasi utama">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-tombol px-2 text-base font-semibold text-teal-aksi"
          >
            Beranda
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
          {status === "masuk" && user?.shop ? (
            <Link
              href="/jualan/pesanan"
              className="inline-flex min-h-11 items-center rounded-tombol bg-mint-muda px-2 text-base font-semibold text-teal-aksi"
            >
              Jualan
            </Link>
          ) : null}
          {status === "masuk" && user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center rounded-tombol bg-krem px-2 text-base font-semibold text-tinta"
            >
              Admin
            </Link>
          ) : null}
          {(status === "masuk" && user?.role === "ADMIN") ||
          (status === "masuk" && user?.role === "OPERATOR_DEMO") ? (
            <Link
              href="/dev"
              className="inline-flex min-h-11 items-center rounded-tombol bg-krem px-2 text-base font-semibold text-tinta"
            >
              Demo
            </Link>
          ) : null}
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
    </header>
  );
}
