"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icon";
import { primaryButtonClass } from "@/components/ui";

/**
 * Batas error global. Menampilkan bahasa sehari-hari dan selalu memberi
 * jalan keluar, bukan nomor teknis.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Catat galat untuk pemeriksaan internal, tanpa menampilkan detail ke pengguna.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-putih px-4">
      <div className="w-full max-w-md rounded-kartu border border-garis bg-putih p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-pil bg-bahaya-muda text-bahaya">
          <Icon name="warning" size={26} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-tinta">
          Halaman ini belum bisa dibuka
        </h1>
        <p className="mt-2 text-base leading-6 text-tinta-lembut">
          Ada yang bermasalah di sisi kami. Coba muat ulang halaman ini. Kalau tetap
          bermasalah, coba lagi beberapa saat lagi.
        </p>
        <button type="button" className={`${primaryButtonClass} mt-5 w-full`} onClick={reset}>
          <Icon name="refresh" size={18} />
          Muat ulang
        </button>
      </div>
    </main>
  );
}
