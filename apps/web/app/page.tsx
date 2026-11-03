import Link from "next/link";
import { formatRupiah } from "@bakul/shared";
import { SiteHeader } from "@/components/site-header";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { StatusPanel } from "./status-panel";

const tokens = [
  { nama: "mint", hex: "#AEE3CD" },
  { nama: "mint-muda", hex: "#D7F2E6" },
  { nama: "teal", hex: "#198B81" },
  { nama: "teal-aksi", hex: "#0F6E66" },
  { nama: "krem", hex: "#F1EADA" },
  { nama: "abu-kartu", hex: "#F5F5F5" },
  { nama: "tinta", hex: "#14201B" },
  { nama: "tinta-lembut", hex: "#5C6B64" },
  { nama: "garis", hex: "#E6E6E6" },
  { nama: "perhatian", hex: "#B45309" },
  { nama: "bahaya", hex: "#B42318" },
];

const fondasi = [
  {
    judul: "Web",
    isi: "Next.js 16 · React 19 · Tailwind 4",
    keterangan: "Halaman ini dirender di port 3000.",
  },
  {
    judul: "API",
    isi: "NestJS 12 · Swagger",
    keterangan: "Menjawab di port 3001 lewat satu origin /api.",
  },
  {
    judul: "Database",
    isi: "PostgreSQL 17 · bakul_dev",
    keterangan: "5 toko, 8 kategori, dan 100 produk siap dipakai.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-putih">
      <SiteHeader />

      <section className="bg-mint">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <p className="text-base font-semibold text-teal-aksi">Ruang kerja pengembangan</p>
          <h1 className="mt-3 max-w-2xl font-display text-[32px] font-bold leading-10 text-tinta md:text-4xl">
            Fondasi Bakul sudah menyala.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-tinta">
            Web, API, dan PostgreSQL lokal sudah tersambung. Token warna dari desain
            FigCraft sudah masuk ke Tailwind, dan uang tetap memakai integer rupiah.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/v1/health"
              className="inline-flex min-h-11 items-center rounded-tombol bg-teal-aksi px-5 text-base font-semibold text-putih"
            >
              Lihat status API
            </a>
            <a
              href="#token"
              className="inline-flex min-h-11 items-center rounded-tombol border border-teal-aksi bg-putih px-5 text-base font-semibold text-teal-aksi"
            >
              Lihat token warna
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <section aria-labelledby="sambungan">
          <h2 id="sambungan" className="sr-only">
            Status sambungan
          </h2>
          <StatusPanel />
        </section>

        <section aria-labelledby="akun" className="rounded-kartu bg-krem p-5">
          <h2 id="akun" className="font-display text-2xl font-bold text-tinta">
            Akun dan toko sudah bisa dicoba
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-6 text-tinta">
            Masuk dengan nomor HP, simpan alamat, buka toko, lalu unggah barang pertama.
            Semua tanpa email dan tanpa KTP. Saat demo, kode masuknya <strong>123456</strong>.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/masuk" className={primaryButtonClass}>
              Masuk
            </Link>
            <Link href="/jualan" className={secondaryButtonClass}>
              Buka toko
            </Link>
            <Link href="/akun" className={secondaryButtonClass}>
              Lihat akun
            </Link>
          </div>
        </section>

        <section aria-labelledby="fondasi">
          <h2 id="fondasi" className="font-display text-2xl font-bold text-tinta">
            Tiga lapisan yang sudah jalan
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {fondasi.map((item) => (
              <article
                key={item.judul}
                className="rounded-kartu border border-garis bg-abu-kartu p-5"
              >
                <p className="text-base font-semibold text-tinta-lembut">{item.judul}</p>
                <p className="mt-1 text-xl font-semibold text-tinta">{item.isi}</p>
                <p className="mt-2 text-base leading-6 text-tinta-lembut">
                  {item.keterangan}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="token" aria-labelledby="judul-token">
          <h2 id="judul-token" className="font-display text-2xl font-bold text-tinta">
            Token warna dari FigCraft
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-6 text-tinta-lembut">
            Nilai di bawah sama dengan <code>apps/web/app/globals.css</code>. Tombol
            utama memakai teal-aksi agar kontrasnya lolos AA.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tokens.map((token) => (
              <li
                key={token.nama}
                className="rounded-kartu border border-garis bg-putih p-3"
              >
                <span
                  aria-hidden="true"
                  className="block h-12 rounded-tombol border border-garis"
                  style={{ backgroundColor: token.hex }}
                />
                <span className="mt-2 block text-base font-semibold text-tinta">
                  {token.nama}
                </span>
                <span className="block text-base text-tinta-lembut">{token.hex}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-kartu bg-krem p-4 text-base text-tinta">
            Contoh format uang: <strong>{formatRupiah(88_609)}</strong>. Tidak ada
            desimal dan tidak ada pemisah koma.
          </p>
        </section>

        <section aria-labelledby="berikutnya">
          <h2 id="berikutnya" className="font-display text-2xl font-bold text-tinta">
            Perjalanan sprint
          </h2>
          <ol className="mt-4 space-y-3">
            <li className="rounded-kartu border border-garis bg-mint-muda p-4 text-base leading-6 text-tinta">
              <strong>Sprint 4 — Akun dan toko. Selesai.</strong> Login nomor HP, alamat,
              buka toko, dan barang pertama dengan foto.
            </li>
            <li className="rounded-kartu border border-garis p-4 text-base leading-6 text-tinta">
              <strong>Sprint 5 — Katalog.</strong> Beranda, cari, detail produk, dan halaman
              toko memakai data yang sudah ada.
            </li>
            <li className="rounded-kartu border border-garis p-4 text-base leading-6 text-tinta">
              <strong>Sprint 6–7 — Bayar dan uang ditahan.</strong> Keranjang multi-toko,
              kode pembayaran, dan ledger yang seimbang.
            </li>
          </ol>
        </section>
      </div>

      <footer className="border-t border-garis bg-putih">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6">
          <p className="text-base text-tinta-lembut">
            Bakul · uang simulasi, tidak ada uang nyata yang berpindah.
          </p>
          <a
            href="/api/docs"
            className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi"
          >
            Dokumentasi API
          </a>
        </div>
      </footer>
    </main>
  );
}
