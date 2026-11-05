"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Icon } from "@/components/icon";
import { SiteFooter } from "@/components/site-footer";
import {
  cardClass,
  errorBoxClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";

export default function LacakIndexPage() {
  const router = useRouter();
  const [awb, setAwb] = useState("");
  const [error, setError] = useState<string | null>(null);

  function lacak(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = awb.trim().toUpperCase();

    if (value.length < 6) {
      setError("Nomor resi belum lengkap. Salin dari halaman pesanan.");
      return;
    }

    setError(null);
    router.push(`/lacak/${encodeURIComponent(value)}`);
  }

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/pesanan"
          className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
        >
          <Icon name="arrowLeft" size={18} />
          Kembali ke pesanan
        </Link>

        <p className="mt-4 text-base font-semibold text-teal-aksi">Pengiriman</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
          Lacak paket
        </h1>
        <p className="mt-2 text-base leading-6 text-tinta-lembut">
          Masukkan nomor resi yang ada di halaman pesanan. Tidak perlu masuk
          untuk melihat posisi kiriman.
        </p>

        <form className={`${cardClass} mt-5`} onSubmit={lacak}>
          <label className={labelClass} htmlFor="awb">
            Nomor resi
          </label>
          <input
            id="awb"
            name="awb"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            className={inputClass}
            value={awb}
            onChange={(event) => {
              setAwb(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="Contoh: 123456789012345"
            aria-describedby="awb-hint"
            aria-invalid={Boolean(error)}
          />
          <p id="awb-hint" className="mt-2 text-base text-tinta-lembut">
            Biasanya 12–20 angka. Awalan huruf seperti JP juga bisa.
          </p>

          {error ? (
            <div className={`${errorBoxClass} mt-3`} role="alert">
              {error}
            </div>
          ) : null}

          <button type="submit" className={`${primaryButtonClass} mt-4 w-full`}>
            <Icon name="truck" size={18} />
            Lacak paket
          </button>
        </form>

        <section className={`${cardClass} mt-4`}>
          <h2 className="font-display text-2xl font-bold text-tinta">
            Punya pesanan di Bakul?
          </h2>
          <p className="mt-2 text-base leading-6 text-tinta-lembut">
            Buka pesanan untuk melihat nomor resi dan tombol lacak pada paket
            yang sudah dikirim.
          </p>
          <Link href="/pesanan" className={`${secondaryButtonClass} mt-3`}>
            Lihat pesanan saya
          </Link>
        </section>

        <p className="mt-4 text-base leading-6 text-tinta-lembut">
          Pengiriman di Bakul adalah simulasi. Tidak ada paket nyata yang
          bergerak.
        </p>
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
