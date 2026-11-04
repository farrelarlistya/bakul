"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppBadges } from "@/components/app-badges";
import { Icon, type IconName } from "@/components/icon";

const items: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/cari", label: "Cari", icon: "search" },
  { href: "/keranjang", label: "Keranjang", icon: "bag" },
  { href: "/pesanan", label: "Pesanan", icon: "receipt" },
  { href: "/akun", label: "Akun", icon: "user" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useAppBadges();

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/cari") {
      return (
        pathname.startsWith("/cari") ||
        pathname.startsWith("/p/") ||
        pathname.startsWith("/toko/")
      );
    }
    if (href === "/keranjang") {
      return (
        pathname.startsWith("/keranjang") ||
        pathname.startsWith("/bayar") ||
        pathname.startsWith("/pembayaran")
      );
    }
    if (href === "/pesanan") {
      return pathname.startsWith("/pesanan") || pathname.startsWith("/lacak");
    }
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-garis bg-putih pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(item.href);
          const showBadge = item.href === "/keranjang" && cartCount > 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-tombol transition duration-cepat ease-standar active:scale-95"
              >
                <span
                  className={`relative flex h-8 w-12 items-center justify-center rounded-[10px] transition duration-cepat ease-standar ${
                    active ? "bg-kuning-pastel text-hutan" : "text-tinta-lembut"
                  }`}
                >
                  <Icon name={item.icon} size={22} />
                  {showBadge ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-pil bg-perhatian px-1 text-base font-bold leading-none text-putih"
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`text-base leading-5 ${
                    active ? "font-semibold text-hutan" : "text-tinta-lembut"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
