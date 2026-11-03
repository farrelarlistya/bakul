"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah, type DemoStatus, type ResetResult } from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

type PendingPayment = {
  id: string;
  paymentCode: string;
  method: string;
  totalAmount: number;
  status: string;
  expiresAt: string;
  buyerName: string;
  shops: string[];
};

function tanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function DemoConsolePage() {
  const { status, user, request } = useAuth();
  const [clock, setClock] = useState<DemoStatus | null>(null);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [minutes, setMinutes] = useState("60");
  const [speed, setSpeed] = useState("60");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [demoStatus, payments] = await Promise.all([
        request<DemoStatus>("/api/v1/demo/status"),
        request<PendingPayment[]>("/api/v1/demo/payments/pending"),
      ]);
      setClock(demoStatus);
      setPending(payments);
      setSpeed(String(demoStatus.speed));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Demo console belum bisa dimuat.");
    }
  }, [request]);

  useEffect(() => {
    if (
      status === "masuk" &&
      (user?.role === "ADMIN" || user?.role === "OPERATOR_DEMO")
    ) {
      void load();
    }
  }, [status, user?.role, load]);

  async function majukan(): Promise<void> {
    const value = Number(minutes);
    if (!value || value < 1) {
      setError("Isi jumlah menit.");
      return;
    }
    setBusy(true);
    try {
      const next = await request<DemoStatus>("/api/v1/demo/clock/advance", {
        method: "POST",
        body: JSON.stringify({ minutes: value }),
      });
      setClock(next);
      setMessage(`Waktu dimajukan ${value} menit.`);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Waktu belum bisa dimajukan.");
    } finally {
      setBusy(false);
    }
  }

  async function ubahKecepatan(): Promise<void> {
    const value = Number(speed);
    setBusy(true);
    try {
      const next = await request<DemoStatus>("/api/v1/demo/clock/speed", {
        method: "POST",
        body: JSON.stringify({ speed: value }),
      });
      setClock(next);
      setMessage(`Kecepatan waktu ${value}×.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Kecepatan belum bisa diubah.");
    } finally {
      setBusy(false);
    }
  }

  async function tick(): Promise<void> {
    setBusy(true);
    try {
      const result = await request<{
        expired: number;
        shipments: number;
        cancelled: number;
        completed: number;
      }>("/api/v1/demo/tick", { method: "POST" });
      setMessage(
        `Pemeriksaan: ${result.expired} tagihan habis, ${result.shipments} resi bergerak, ` +
          `${result.cancelled} batal otomatis, ${result.completed} selesai otomatis.`,
      );
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pemeriksaan belum bisa dijalankan.");
    } finally {
      setBusy(false);
    }
  }

  async function aksiPembayaran(id: string, action: "pay" | "fail" | "expire"): Promise<void> {
    setBusy(true);
    try {
      await request(`/api/v1/demo/payments/${id}/${action}`, { method: "POST" });
      setMessage("Perintah pembayaran dikirim. Tunggu beberapa detik lalu periksa pesanan.");
      await new Promise((resolve) => setTimeout(resolve, 1800));
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Perintah pembayaran gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(): Promise<void> {
    if (
      !window.confirm(
        "Kosongkan semua pesanan, pembayaran, dompet, dan ledger demo? Data toko dan barang tetap ada.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const result = await request<ResetResult>("/api/v1/demo/reset", { method: "POST" });
      setMessage(
        `Data transaksi dikosongkan: ${result.deleted.payments} pembayaran, ` +
          `${result.deleted.invoices} pesanan, ${result.deleted.ledgerJournals} jurnal.`,
      );
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Reset belum bisa dijalankan.");
    } finally {
      setBusy(false);
    }
  }

  const allowed = status === "masuk" && (user?.role === "ADMIN" || user?.role === "OPERATOR_DEMO");

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-base font-semibold text-teal-aksi">Mode demo</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Demo console</h1>
        <p className="mt-2 text-base text-tinta-lembut">
          Majukan waktu, picu pembayaran, dan jalankan pemeriksaan tanpa menunggu berhari-hari.
          Semua uang simulasi.
        </p>

        {!allowed ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">
              Halaman ini hanya untuk admin atau operator demo.
            </p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">{message}</p>
        ) : null}

        {allowed && clock ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Waktu simulasi</h2>
              <p className="mt-2 text-base text-tinta-lembut">Sekarang</p>
              <p className="text-lg font-semibold text-tinta">{tanggal(clock.now)}</p>
              <p className="mt-1 text-base text-tinta-lembut">Kecepatan {clock.speed}×</p>
              <p className="text-base text-tinta-lembut">
                Mode demo {clock.demoMode ? "aktif" : "mati"}
              </p>

              <label className={`${labelClass} mt-4`} htmlFor="minutes">
                Majukan berapa menit?
              </label>
              <div className="flex gap-2">
                <input
                  id="minutes"
                  inputMode="numeric"
                  className={inputClass}
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value.replace(/\D/g, ""))}
                />
                <button type="button" className={primaryButtonClass} disabled={busy} onClick={() => void majukan()}>
                  Majukan
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[60, 24 * 60, 48 * 60, 72 * 60].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={secondaryButtonClass}
                    disabled={busy}
                    onClick={() => setMinutes(String(value))}
                  >
                    {value === 60 ? "1 jam" : `${value / 60} jam`}
                  </button>
                ))}
              </div>

              <label className={`${labelClass} mt-4`} htmlFor="speed">
                Kecepatan waktu
              </label>
              <div className="flex gap-2">
                <input
                  id="speed"
                  inputMode="numeric"
                  className={inputClass}
                  value={speed}
                  onChange={(event) => setSpeed(event.target.value.replace(/\D/g, ""))}
                />
                <button type="button" className={secondaryButtonClass} disabled={busy} onClick={() => void ubahKecepatan()}>
                  Simpan
                </button>
              </div>
              <button type="button" className={`${primaryButtonClass} mt-4 w-full`} disabled={busy} onClick={() => void tick()}>
                Jalankan pemeriksaan sekarang
              </button>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Simulator pembayaran</h2>
              {pending.length === 0 ? (
                <p className="mt-2 text-base text-tinta-lembut">
                  Tidak ada tagihan yang menunggu. Buat pesanan dari akun pembeli dulu.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {pending.map((payment) => (
                    <li key={payment.id} className="rounded-kartu border border-garis p-3">
                      <p className="text-base font-semibold text-tinta">
                        {payment.paymentCode} · {formatRupiah(payment.totalAmount)}
                      </p>
                      <p className="text-base text-tinta-lembut">
                        {payment.buyerName} · {payment.shops.join(", ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={primaryButtonClass}
                          disabled={busy}
                          onClick={() => void aksiPembayaran(payment.id, "pay")}
                        >
                          Bayar
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          disabled={busy}
                          onClick={() => void aksiPembayaran(payment.id, "fail")}
                        >
                          Gagal
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          disabled={busy}
                          onClick={() => void aksiPembayaran(payment.id, "expire")}
                        >
                          Kedaluwarsa
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${cardClass} lg:col-span-2`}>
              <h2 className="font-display text-2xl font-bold text-tinta">Alat demo</h2>
              <p className="mt-2 text-base text-tinta-lembut">
                Reset mengosongkan pesanan, pembayaran, dompet, dan ledger. Data pengguna, toko,
                dan barang tetap. Jalankan <code>npm run db:seed</code> untuk mengisi riwayat lagi.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin" className={secondaryButtonClass}>
                  Dashboard admin
                </Link>
                <Link href="/admin/komplain" className={secondaryButtonClass}>
                  Pusat komplain
                </Link>
                <Link href="/admin/pencairan" className={secondaryButtonClass}>
                  Pencairan
                </Link>
                <button type="button" className={dangerButtonClass} disabled={busy} onClick={() => void reset()}>
                  Reset data transaksi
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
