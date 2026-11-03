"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CartView, NotificationItem } from "@bakul/shared";
import { Icon } from "@/components/icon";
import { useAuth } from "@/lib/auth";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-pil bg-perhatian px-1 text-xs font-bold leading-none text-putih">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const iconLinkClass =
  "relative inline-flex h-11 w-11 items-center justify-center rounded-tombol text-teal-aksi transition-colors hover:bg-mint-muda focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-aksi focus-visible:ring-offset-2";

export function HomeHeader() {
  const { status, user, request } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "masuk") {
      setCartCount(0);
      setUnreadCount(0);
      return;
    }

    let alive = true;

    void Promise.all([
      request<CartView>("/api/v1/cart"),
      request<NotificationItem[]>("/api/v1/notifications"),
    ])
      .then(([cart, notifications]) => {
        if (!alive) {
          return;
        }
        setCartCount(cart.totalItems);
        setUnreadCount(notifications.filter((item) => !item.isRead).length);
      })
      .catch(() => {
        // Badge tidak boleh menghalangi halaman utama.
      });

    return () => {
      alive = false;
    };
  }, [status, request]);

  return (
    <header className="sticky top-0 z-30 border-b border-garis bg-putih">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
        <Link
          href="/"
          className="mr-1 inline-flex min-h-11 shrink-0 items-center font-display text-2xl font-bold text-tinta"
        >
          bakul
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi Beranda">
          <a
            href="#kategori"
            className="inline-flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
          >
            Kategori
          </a>
          <a
            href="#produk"
            className="inline-flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
          >
            Lagi laris
          </a>
          <Link
            href="/pesanan"
            className="inline-flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
          >
            Pesanan
          </Link>
        </nav>

        <form
          action="/cari"
          method="get"
          className="ml-2 hidden min-h-11 flex-1 items-center gap-2 rounded-tombol border border-garis bg-abu-kartu px-3 md:flex"
        >
          <Icon name="search" size={18} className="shrink-0 text-tinta-lembut" />
          <label htmlFor="header-search" className="sr-only">
            Cari barang
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="Cari nastar, kopi, batik..."
            className="min-h-10 w-full bg-transparent text-base text-tinta outline-none placeholder:text-tinta-lembut"
          />
        </form>

        <div className="ml-auto flex items-center gap-0.5">
          <Link href="/cari" className={`${iconLinkClass} md:hidden`} aria-label="Cari barang">
            <Icon name="search" size={22} />
          </Link>
          <Link href="/inbox" className={iconLinkClass} aria-label="Buka inbox">
            <Icon name="chat" size={22} />
            <CountBadge count={unreadCount} />
          </Link>
          <Link href="/keranjang" className={iconLinkClass} aria-label="Buka keranjang">
            <Icon name="bag" size={22} />
            <CountBadge count={cartCount} />
          </Link>

          {status === "masuk" && user ? (
            <Link
              href="/akun"
              className="ml-1 hidden h-10 w-10 items-center justify-center rounded-pil bg-krem font-display text-base font-bold text-teal-aksi md:inline-flex"
              aria-label="Buka akun"
            >
              {user.name.slice(0, 1).toUpperCase()}
            </Link>
          ) : (
            <Link
              href="/masuk"
              className="ml-1 hidden min-h-11 items-center rounded-tombol bg-teal-aksi px-4 text-base font-semibold text-putih md:inline-flex"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
