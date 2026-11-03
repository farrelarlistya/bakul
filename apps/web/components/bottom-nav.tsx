"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Beranda", path: "M3 11 L12 3 L21 11 V21 H14 V15 H10 V21 H3 Z" },
  { href: "/cari", label: "Cari", path: "M9 3 A6 6 0 1 0 9 15 A6 6 0 0 0 9 3 M14 14 L19 19" },
  {
    href: "/keranjang",
    label: "Keranjang",
    path: "M3 4 H5 L7 17 H18 L21 7 H6 M9 21 A1 1 0 1 0 9 19 M17 21 A1 1 0 1 0 17 19",
  },
  {
    href: "/pesanan",
    label: "Pesanan",
    path: "M5 3 H19 V21 L12 17 L5 21 Z M8 8 H16 M8 12 H16",
  },
  {
    href: "/akun",
    label: "Akun",
    path: "M12 11 A4 4 0 1 0 12 3 A4 4 0 0 0 12 11 M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-garis bg-putih pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const color = active ? "#0F6E66" : "#5C6B64";

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-16 flex-col items-center justify-center gap-1"
              >
                <svg
                  aria-hidden="true"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.path} />
                </svg>
                <span
                  className="text-base"
                  style={{ color, fontWeight: active ? 600 : 400 }}
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
