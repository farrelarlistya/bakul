import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-tinta text-putih">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-bold">bakul</p>
            <p className="mt-3 max-w-sm text-base leading-6 text-mint">
              Pasar daring untuk pedagang kecil Indonesia. Uang aman sampai barang
              diterima.
            </p>
          </div>

          <div>
            <p className="text-base font-semibold text-putih">Jelajahi</p>
            <ul className="mt-3 space-y-2 text-base text-mint">
              <li>
                <Link href="/" className="inline-flex min-h-11 items-center">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/cari" className="inline-flex min-h-11 items-center">
                  Cari barang
                </Link>
              </li>
              <li>
                <Link href="/keranjang" className="inline-flex min-h-11 items-center">
                  Keranjang
                </Link>
              </li>
              <li>
                <Link href="/pesanan" className="inline-flex min-h-11 items-center">
                  Pesanan
                </Link>
              </li>
              <li>
                <Link href="/inbox" className="inline-flex min-h-11 items-center">
                  Inbox
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-base font-semibold text-putih">Untuk penjual</p>
            <ul className="mt-3 space-y-2 text-base text-mint">
              <li>
                <Link href="/jualan" className="inline-flex min-h-11 items-center">
                  Buka toko gratis
                </Link>
              </li>
              <li>
                <Link href="/jualan/pesanan" className="inline-flex min-h-11 items-center">
                  Pesanan masuk
                </Link>
              </li>
              <li>
                <Link href="/jualan/dompet" className="inline-flex min-h-11 items-center">
                  Dompet toko
                </Link>
              </li>
              <li>
                <Link href="/akun" className="inline-flex min-h-11 items-center">
                  Akun dan alamat
                </Link>
              </li>
              <li>
                <a href="/api/v1/health" className="inline-flex min-h-11 items-center">
                  Status sistem
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#3c4a43] pt-5 text-base text-mint">
          <p>Pembayaran dan pengiriman di Bakul adalah simulasi.</p>
          <p className="mt-1">Tidak ada uang nyata yang berpindah.</p>
        </div>
      </div>
    </footer>
  );
}
