"use client";

import { useCallback, useEffect, useState } from "react";
import type { HealthResponse } from "@bakul/shared";

type ConnectionState =
  | { kind: "memeriksa" }
  | { kind: "tersambung"; health: HealthResponse }
  | { kind: "gagal"; pesan: string };

function waktu(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function StatusPanel() {
  const [state, setState] = useState<ConnectionState>({ kind: "memeriksa" });

  const periksa = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: "memeriksa" });

    try {
      const response = await fetch("/api/v1/health", { signal, cache: "no-store" });
      const body: unknown = await response.json();

      if (!response.ok) {
        const pesan =
          typeof body === "object" && body !== null && "message" in body
            ? String(body.message)
            : "API belum siap.";
        throw new Error(pesan);
      }

      setState({ kind: "tersambung", health: body as HealthResponse });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const pesan =
        error instanceof Error
          ? error.message
          : "API belum tersambung. Pastikan PostgreSQL dan API berjalan.";
      setState({ kind: "gagal", pesan });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void periksa(controller.signal);

    return () => controller.abort();
  }, [periksa]);

  return (
    <div className="rounded-kartu border border-garis bg-putih p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-tinta">Status sambungan</h2>
        <span
          className={`inline-flex min-h-8 items-center rounded-pil px-3 text-base font-semibold ${
            state.kind === "tersambung"
              ? "bg-mint-muda text-teal-aksi"
              : state.kind === "gagal"
                ? "bg-[#fbeae8] text-bahaya"
                : "bg-krem text-tinta"
          }`}
        >
          {state.kind === "tersambung"
            ? "Tersambung"
            : state.kind === "gagal"
              ? "Belum tersambung"
              : "Memeriksa"}
        </span>
      </div>

      {state.kind === "memeriksa" ? (
        <p className="mt-4 text-base text-tinta-lembut">Memeriksa API dan database…</p>
      ) : null}

      {state.kind === "tersambung" ? (
        <div className="mt-4 space-y-2">
          <p className="text-lg font-semibold text-tinta">
            API dan PostgreSQL lokal tersambung.
          </p>
          <p className="text-base text-tinta-lembut">
            Diperiksa pukul {waktu(state.health.checkedAt)} WIB · versi{" "}
            {state.health.version}
          </p>
        </div>
      ) : null}

      {state.kind === "gagal" ? (
        <div className="mt-4 space-y-2">
          <p className="text-lg font-semibold text-bahaya">API belum tersambung.</p>
          <p className="text-base text-tinta-lembut">
            {state.pesan} Jalankan <code className="font-semibold">npm run dev</code> dan
            pastikan PostgreSQL hidup.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void periksa()}
        className="mt-5 inline-flex min-h-11 items-center rounded-tombol border border-teal-aksi bg-putih px-5 text-base font-semibold text-teal-aksi"
      >
        Periksa lagi
      </button>
    </div>
  );
}
