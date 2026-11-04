"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { UserRole } from "@bakul/shared";
import { useAppBadges } from "@/components/app-badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Icon } from "@/components/icon";
import { useAuth } from "@/lib/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  BUYER: "Pembeli",
  SELLER: "Penjual",
  ADMIN: "Admin",
  OPERATOR_DEMO: "Operator demo",
};

const iconLinkClass =
  "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pil text-putih transition duration-cepat ease-standar hover:bg-putih/10 aria-[current=page]:bg-putih/15 aria-[current=page]:text-kuning active:scale-95 focus-visible:outline-putih";

const navLinkClass =
  "inline-flex min-h-11 shrink-0 items-center rounded-pil px-3 text-base font-semibold text-putih/90 transition duration-cepat ease-standar hover:bg-putih/10 hover:text-putih aria-[current=page]:bg-putih/15 aria-[current=page]:text-kuning focus-visible:outline-putih";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 inline-flex min-h-6 min-w-6 items-center justify-center rounded-pil bg-kuning px-1 text-base font-bold leading-none text-tinta"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppHeader({ defaultQuery = "" }: { defaultQuery?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const { cartCount, unreadCount } = useAppBadges();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmKeluar, setConfirmKeluar] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const roleActiveRef = useRef<HTMLAnchorElement>(null);
  const isCari =
    pathname.startsWith("/cari") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/toko/");
  const isPesanan =
    pathname.startsWith("/pesanan") || pathname.startsWith("/lacak");
  const isAdminArea =
    user?.role === "ADMIN" &&
    (pathname.startsWith("/admin") || pathname === "/dev");
  const isDemoArea = user?.role === "OPERATOR_DEMO" && pathname === "/dev";
  const isSellerArea = pathname.startsWith("/jualan") && Boolean(user?.shop);
  const roleNav = isAdminArea
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/komplain", label: "Komplain" },
        { href: "/admin/pencairan", label: "Pencairan" },
        { href: "/admin/toko", label: "Toko & barang" },
        { href: "/dev", label: "Demo console" },
      ]
    : isDemoArea
      ? [{ href: "/dev", label: "Demo console" }]
      : isSellerArea
        ? [
            { href: "/jualan", label: "Ringkasan" },
            { href: "/jualan/pesanan", label: "Pesanan" },
            { href: "/jualan/barang", label: "Barang" },
            { href: "/jualan/dompet", label: "Dompet" },
            { href: "/jualan/toko", label: "Toko" },
          ]
        : null;

  function isRoleActive(href: string): boolean {
    const home = href === "/jualan" || href === "/admin" || href === "/dev";
    return home
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    roleActiveRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [pathname, user?.id]);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent): void {
      if (!menuOpen) {
        return;
      }
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  async function keluar(): Promise<void> {
    setConfirmKeluar(false);
    try {
      await logout();
    } finally {
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  const cartLabel =
    cartCount > 0 ? `Buka keranjang, ${cartCount} barang` : "Buka keranjang";
  const inboxLabel =
    unreadCount > 0 ? `Buka inbox, ${unreadCount} belum dibaca` : "Buka inbox";

  const menuItemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-tombol px-3 text-base font-semibold text-tinta transition duration-cepat ease-standar hover:bg-abu-kartu";

  return (
    <header className="sticky top-0 z-40 border-b border-hutan-tua bg-hutan">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-1 px-4 md:h-[72px]">
        <Link
          href="/"
          className="mr-1 inline-flex min-h-11 shrink-0 items-center font-display text-2xl font-bold text-putih transition duration-cepat ease-standar hover:text-kuning focus-visible:outline-putih md:text-[26px]"
        >
          bakul
        </Link>

        <form
          action="/cari"
          method="get"
          role="search"
          className="pencarian-pil ml-2 hidden min-h-12 flex-1 items-center gap-1 rounded-pil border-2 border-transparent bg-putih p-0.5 pl-4 focus-within:border-kuning md:flex md:max-w-[560px]"
        >
          <Icon
            name="search"
            size={18}
            className="shrink-0 text-tinta-lembut"
          />
          <label htmlFor="header-search" className="sr-only">
            Cari barang
          </label>
          <input
            key={defaultQuery}
            id="header-search"
            name="q"
            type="search"
            defaultValue={defaultQuery}
            placeholder="Cari nastar, kopi, batik..."
            className="min-h-11 w-full bg-transparent text-base text-tinta outline-none placeholder:text-tinta-lembut"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-pil bg-kuning px-4 text-base font-semibold text-tinta transition duration-cepat ease-standar hover:bg-kuning-tua active:scale-95"
          >
            Cari
          </button>
        </form>

        <div className="ml-auto flex items-center gap-0.5">
          <Link
            href="/cari"
            aria-current={isCari ? "page" : undefined}
            className={`${iconLinkClass} md:hidden`}
            aria-label="Cari barang"
          >
            <Icon name="search" size={22} />
          </Link>
          <Link
            href="/pesanan"
            aria-current={isPesanan ? "page" : undefined}
            className={`${iconLinkClass} max-md:hidden`}
            aria-label="Pesanan"
          >
            <Icon name="receipt" size={22} />
          </Link>
          <Link
            href="/inbox"
            aria-current={pathname.startsWith("/inbox") ? "page" : undefined}
            className={iconLinkClass}
            aria-label={inboxLabel}
          >
            <Icon name="chat" size={22} />
            <CountBadge count={unreadCount} />
          </Link>
          <Link
            href="/keranjang"
            aria-current={
              pathname.startsWith("/keranjang") || pathname.startsWith("/bayar")
                ? "page"
                : undefined
            }
            className={iconLinkClass}
            aria-label={cartLabel}
          >
            <Icon name="bag" size={22} />
            <CountBadge count={cartCount} />
          </Link>

          {status === "masuk" && user ? (
            <div ref={menuRef} className="relative ml-0.5">
              <button
                type="button"
                ref={accountButtonRef}
                aria-label={`Menu akun ${user.name}`}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pil bg-kuning font-display text-base font-bold text-tinta transition duration-cepat ease-standar hover:bg-kuning-tua active:scale-95 focus-visible:outline-putih"
              >
                {user.name.slice(0, 1).toUpperCase()}
              </button>

              {menuOpen ? (
                <div className="animate-muncul absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-kartu-besar border border-garis-kuat bg-putih p-2">
                  <div className="px-3 py-2">
                    <p className="text-base font-semibold text-tinta">{user.name}</p>
                    <p className="text-base text-tinta-lembut">
                      {ROLE_LABEL[user.role]}
                    </p>
                  </div>
                  <div className="my-1 border-t border-garis" />
                  <Link href="/akun" className={menuItemClass}>
                    <Icon name="user" size={18} className="text-tinta-lembut" />
                    Akun dan alamat
                  </Link>
                  <Link href="/pesanan" className={menuItemClass}>
                    <Icon name="receipt" size={18} className="text-tinta-lembut" />
                    Pesanan
                  </Link>
                  {user.shop ? (
                    <Link href="/jualan" className={menuItemClass}>
                      <Icon name="store" size={18} className="text-tinta-lembut" />
                      Jualan
                    </Link>
                  ) : null}
                  {user.role === "ADMIN" ? (
                    <Link href="/admin" className={menuItemClass}>
                      <Icon name="chart" size={18} className="text-tinta-lembut" />
                      Admin
                    </Link>
                  ) : null}
                  {user.role === "ADMIN" || user.role === "OPERATOR_DEMO" ? (
                    <Link href="/dev" className={menuItemClass}>
                      <Icon name="sliders" size={18} className="text-tinta-lembut" />
                      Demo console
                    </Link>
                  ) : null}
                  <div className="my-1 border-t border-garis" />
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center gap-3 rounded-tombol px-3 text-left text-base font-semibold text-bahaya transition duration-cepat ease-standar hover:bg-bahaya-muda"
                    onClick={() => setConfirmKeluar(true)}
                  >
                    <Icon name="close" size={18} />
                    Keluar
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/masuk"
              className="ml-0.5 inline-flex min-h-11 shrink-0 items-center rounded-pil bg-kuning px-4 text-base font-semibold text-tinta transition duration-sedang ease-standar hover:bg-kuning-tua active:scale-[0.98] focus-visible:outline-putih"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>

      {!roleNav ? (
        <div className="hidden border-t border-putih/10 bg-hutan-tua md:block">
          <nav
            aria-label="Jelajahi katalog"
            className="mx-auto flex max-w-[1200px] items-center gap-1 px-4 py-1"
          >
            <Link
              href="/cari"
              aria-current={isCari ? "page" : undefined}
              className={navLinkClass}
            >
              Semua barang
            </Link>
            <Link href="/cari?sort=terlaris" className={navLinkClass}>
              Terlaris
            </Link>
            <Link href="/cari?sort=harga-asc" className={navLinkClass}>
              Termurah
            </Link>
            <Link
              href="/jualan"
              aria-current={
                pathname.startsWith("/jualan") ? "page" : undefined
              }
              className={navLinkClass}
            >
              Buka toko
            </Link>
            <Link
              href="/lacak"
              aria-current={isPesanan ? "page" : undefined}
              className={navLinkClass}
            >
              Lacak pesanan
            </Link>
          </nav>
        </div>
      ) : null}

      {roleNav ? (
        <div className="border-t border-putih/10 bg-hutan-tua">
          <nav
            aria-label="Navigasi peran"
            className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 py-1"
          >
            {roleNav.map((item) => {
              const active = isRoleActive(item.href);
              return (
                <Link
                  key={item.href}
                  ref={active ? roleActiveRef : undefined}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-pil px-3 text-base font-semibold transition duration-cepat ease-standar focus-visible:outline-putih ${
                    active
                      ? "bg-putih text-hutan"
                      : "text-putih/90 hover:bg-putih/10 hover:text-putih"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmKeluar}
        title="Keluar dari akun?"
        description="Kamu bisa masuk lagi dengan nomor HP dan kode 6 angka."
        confirmLabel="Ya, keluar"
        cancelLabel="Batal"
        onConfirm={() => void keluar()}
        onCancel={() => setConfirmKeluar(false)}
      />
    </header>
  );
}
