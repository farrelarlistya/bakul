"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TITLES: Record<string, string> = {
  "/": "Beranda",
  "/cari": "Cari barang",
  "/keranjang": "Keranjang",
  "/pesanan": "Pesanan",
  "/lacak": "Lacak paket",
  "/inbox": "Inbox",
  "/akun": "Akun",
  "/masuk": "Masuk",
  "/bayar": "Bayar",
  "/jualan": "Jualan",
  "/jualan/pesanan": "Pesanan masuk",
  "/jualan/barang": "Barang dagangan",
  "/jualan/dompet": "Dompet toko",
  "/jualan/toko": "Pengaturan toko",
  "/admin": "Dashboard admin",
  "/admin/komplain": "Pusat resolusi",
  "/admin/pencairan": "Pencairan saldo",
  "/admin/toko": "Toko & barang",
  "/dev": "Demo console",
};

function pageTitle(pathname: string): string {
  if (TITLES[pathname]) {
    return TITLES[pathname];
  }
  if (pathname.startsWith("/p/")) {
    return "Detail barang";
  }
  if (pathname.startsWith("/toko/")) {
    return "Toko";
  }
  if (pathname.startsWith("/pesanan/") && pathname.endsWith("/komplain")) {
    return "Komplain";
  }
  if (pathname.startsWith("/pesanan/")) {
    return "Detail pesanan";
  }
  if (pathname.startsWith("/lacak/")) {
    return "Lacak paket";
  }
  if (pathname.startsWith("/pembayaran/")) {
    return "Pembayaran";
  }
  return "Bakul";
}

export function DocumentTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const title = `${pageTitle(pathname)} · Bakul`;

    function apply(): void {
      if (document.title !== title) {
        document.title = title;
      }
    }

    apply();

    // Next.js menulis ulang judul metadata saat hidrasi. Jaga judul halaman
    // yang spesifik selama proses itu, lalu lepaskan pengamat.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const stop = window.setTimeout(() => observer.disconnect(), 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(stop);
    };
  }, [pathname]);

  return null;
}
