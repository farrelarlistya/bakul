import Link from "next/link";
import { Icon } from "@/components/icon";
import { primaryButtonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-putih px-4">
      <div className="w-full max-w-md rounded-kartu border border-garis bg-putih p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-pil bg-mint-muda text-teal-aksi">
          <Icon name="search" size={26} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-tinta">
          Halaman ini tidak ditemukan
        </h1>
        <p className="mt-2 text-base leading-6 text-tinta-lembut">
          Maybe alamatnya salah, atau halamannya sudah dipindahkan. Coba kembali ke Beranda
          atau cari barang yang kamu cari.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/" className={primaryButtonClass}>
            Kembali ke Beranda
          </Link>
          <Link
            href="/cari"
            className="inline-flex min-h-11 items-center justify-center rounded-tombol border border-teal-aksi bg-putih px-5 text-base font-semibold text-teal-aksi transition duration-sedang ease-standar hover:bg-mint-muda"
          >
            Cari barang
          </Link>
        </div>
      </div>
    </main>
  );
}
