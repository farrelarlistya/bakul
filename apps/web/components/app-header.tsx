"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CartView, NotificationItem, UserRole } from "@bakul/shared";
import { Icon } from "@/components/icon";
import { BADGES_EVENT } from "@/lib/badges";
import { useAuth } from "@/lib/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  BUYER: "Pembeli",
  SELLER: "Penjual",
  ADMIN: "Admin",
  OPERATOR_DEMO: "Operator demo",
};

const iconLinkClass =
  "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-tombol text-teal-aksi transition-colors hover:bg-mint-muda";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 inline-flex min-h-6 min-w-6 items-center justify-center rounded-pil bg-perhatian px-1 text-base font-bold leading-none text-putih"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppHeader({ defaultQuery = "" }: { defaultQuery?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout, request } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const roleActiveRef = useRef<HTMLAnchorElement>(null);
  const isHome = pathname === "/";
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
    function refresh(): void {
      setBadgeVersion((value) => value + 1);
    }

    window.addEventListener(BADGES_EVENT, refresh);
    return () => window.removeEventListener(BADGES_EVENT, refresh);
  }, []);

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
  }, [status, request, pathname, badgeVersion]);

  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    roleActiveRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [pathname, user?.id]);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent): void {
      if (!menuRef.current?.open) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        menuRef.current.removeAttribute("open");
      }
    }

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.removeAttribute("open");
        menuRef.current.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function keluar(): Promise<void> {
    try {
      await logout();
    } finally {
      menuRef.current?.removeAttribute("open");
      router.push("/");
      router.refresh();
    }
  }

  const cartLabel =
    cartCount > 0 ? `Buka keranjang, ${cartCount} barang` : "Buka keranjang";
  const inboxLabel =
    unreadCount > 0 ? `Buka inbox, ${unreadCount} belum dibaca` : "Buka inbox";

  return (
    <header className="sticky top-0 z-40 border-b border-garis bg-putih">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-1 px-4">
        <Link
          href="/"
          className="mr-1 inline-flex min-h-11 shrink-0 items-center font-display text-2xl font-bold text-tinta"
        >
          bakul
        </Link>

        {!roleNav ? (
          <nav
            className="ml-1 hidden items-center gap-0.5 md:flex"
            aria-label="Navigasi utama"
          >
            {isHome ? (
              <>
                <a
                  href="#kategori"
                  className="inline-flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta transition-colors hover:bg-abu-kartu"
                >
                  Kategori
                </a>
                <a
                  href="#produk"
                  className="inline-flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta transition-colors hover:bg-abu-kartu"
                >
                  Lagi laris
                </a>
              </>
            ) : (
              <Link
                href="/cari"
                aria-current={isCari ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta transition-colors hover:bg-abu-kartu aria-[current=page]:text-teal-aksi"
              >
                Cari
              </Link>
            )}
            <Link
              href="/pesanan"
              aria-current={isPesanan ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta transition-colors hover:bg-abu-kartu aria-[current=page]:text-teal-aksi"
            >
              Pesanan
            </Link>
          </nav>
        ) : null}

        <form
          action="/cari"
          method="get"
          role="search"
          className="ml-3 hidden min-h-11 flex-1 items-center gap-2 rounded-tombol border border-garis bg-abu-kartu px-3 md:flex"
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
            <details
              ref={menuRef}
              className="relative ml-0.5"
              onBlur={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  event.currentTarget.removeAttribute("open");
                }
              }}
            >
              <summary
                aria-label={`Menu akun ${user.name}`}
                className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-pil bg-krem font-display text-base font-bold text-teal-aksi marker:hidden [&::-webkit-details-marker]:hidden"
              >
                {user.name.slice(0, 1).toUpperCase()}
              </summary>

              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-kartu border border-garis bg-putih p-2">
                <div className="px-3 py-2">
                  <p className="text-base font-semibold text-tinta">
                    {user.name}
                  </p>
                  <p className="text-base text-tinta-lembut">
                    {ROLE_LABEL[user.role]}
                  </p>
                </div>
                <div className="my-1 border-t border-garis" />
                <Link
                  href="/akun"
                  className="flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
                >
                  Akun dan alamat
                </Link>
                <Link
                  href="/pesanan"
                  className="flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
                >
                  Pesanan
                </Link>
                {user.shop ? (
                  <Link
                    href="/jualan"
                    className="flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
                  >
                    Jualan
                  </Link>
                ) : null}
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
                  >
                    Admin
                  </Link>
                ) : null}
                {user.role === "ADMIN" || user.role === "OPERATOR_DEMO" ? (
                  <Link
                    href="/dev"
                    className="flex min-h-11 items-center rounded-tombol px-3 text-base font-semibold text-tinta hover:bg-abu-kartu"
                  >
                    Demo console
                  </Link>
                ) : null}
                <div className="my-1 border-t border-garis" />
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center rounded-tombol px-3 text-left text-base font-semibold text-bahaya hover:bg-[#fbeae8]"
                  onClick={() => void keluar()}
                >
                  Keluar
                </button>
              </div>
            </details>
          ) : (
            <Link
              href="/masuk"
              className="ml-0.5 inline-flex min-h-11 shrink-0 items-center rounded-tombol bg-teal-aksi px-3 text-base font-semibold text-putih transition-colors hover:bg-teal-tua"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>

      {roleNav ? (
        <div className="border-t border-garis">
          <nav
            aria-label="Navigasi peran"
            className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-1"
          >
            {roleNav.map((item) => {
              const active = isRoleActive(item.href);
              return (
                <Link
                  key={item.href}
                  ref={active ? roleActiveRef : undefined}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-tombol px-3 text-base font-semibold transition-colors ${
                    active
                      ? "bg-mint-muda text-teal-aksi"
                      : "text-tinta hover:bg-abu-kartu"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
