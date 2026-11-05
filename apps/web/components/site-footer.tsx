import Link from "next/link";

const linkClass =
  "inline-flex min-h-11 items-center rounded-pil px-2 text-base text-putih/80 transition duration-cepat ease-standar hover:bg-putih/10 hover:text-putih hover:underline";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-putih/10 bg-hutan-tua text-putih">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-bold">bakul</p>
            <p className="mt-3 max-w-sm text-base leading-6 text-putih/75">
              Pasar daring untuk pedagang kecil Indonesia. Uang aman sampai barang
              diterima.
            </p>
          </div>

          <nav aria-label="Tautan halaman">
            <p className="text-base font-semibold text-putih">Jelajahi</p>
            <ul className="mt-3 space-y-1">
              <li>
                <Link href="/" className={linkClass}>
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/cari" className={linkClass}>
                  Cari barang
                </Link>
              </li>
              <li>
                <Link href="/keranjang" className={linkClass}>
                  Keranjang
                </Link>
              </li>
              <li>
                <Link href="/pesanan" className={linkClass}>
                  Pesanan
                </Link>
              </li>
              <li>
                <Link href="/lacak" className={linkClass}>
                  Lacak paket
                </Link>
              </li>
              <li>
                <Link href="/inbox" className={linkClass}>
                  Inbox
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Tautan penjual">
            <p className="text-base font-semibold text-putih">Untuk penjual</p>
            <ul className="mt-3 space-y-1">
              <li>
                <Link href="/jualan" className={linkClass}>
                  Buka toko gratis
                </Link>
              </li>
              <li>
                <Link href="/jualan/pesanan" className={linkClass}>
                  Pesanan masuk
                </Link>
              </li>
              <li>
                <Link href="/jualan/dompet" className={linkClass}>
                  Dompet toko
                </Link>
              </li>
              <li>
                <Link href="/akun" className={linkClass}>
                  Akun dan alamat
                </Link>
              </li>
              <li>
                <a href="/api/v1/health" className={linkClass}>
                  Status sistem
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/15 pt-5 text-base text-putih/75">
          <p>Pembayaran dan pengiriman di Bakul adalah simulasi.</p>
          <p className="mt-1">Tidak ada uang nyata yang berpindah.</p>
        </div>
      </div>
    </footer>
  );
}
