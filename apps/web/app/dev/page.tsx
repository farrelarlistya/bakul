"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah, type DemoStatus, type ResetResult } from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { Icon } from "@/components/icon";
import { Skeleton } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  inputClass,
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
  const { notify } = useToast();
  const [clock, setClock] = useState<DemoStatus | null>(null);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [minutes, setMinutes] = useState("60");
  const [speed, setSpeed] = useState("60");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [konfirmasiReset, setKonfirmasiReset] = useState(false);

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
    } finally {
      setLoading(false);
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
      const pesan = `Waktu dimajukan ${value} menit.`;
      setMessage(pesan);
      notify(pesan);
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
      const pesan = `Kecepatan waktu ${value}×.`;
      setMessage(pesan);
      notify(pesan);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Kecepatan waktu belum bisa diubah.");
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
      const pesan =
        `Pemeriksaan: ${result.expired} tagihan habis, ${result.shipments} resi bergerak, ` +
        `${result.cancelled} batal otomatis, ${result.completed} selesai otomatis.`;
      setMessage(pesan);
      notify(pesan);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pemeriksaan belum bisa dijalankan.");
    } finally {
      setBusy(false);
    }
  }

  async function aksiPembayaran(
    id: string,
    action: "pay" | "fail" | "expire",
  ): Promise<void> {
    setBusy(true);
    try {
      await request(`/api/v1/demo/payments/${id}/${action}`, { method: "POST" });
      const pesan = "Perintah pembayaran dikirim. Tunggu beberapa detik lalu periksa pesanan.";
      setMessage(pesan);
      notify(pesan);
      await new Promise((resolve) => setTimeout(resolve, 1800));
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Perintah pembayaran gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(): Promise<void> {
    setKonfirmasiReset(false);
    setBusy(true);
    try {
      const result = await request<ResetResult>("/api/v1/demo/reset", { method: "POST" });
      const pesan =
        `Data transaksi dikosongkan: ${result.deleted.payments} pembayaran, ` +
        `${result.deleted.invoices} pesanan, ${result.deleted.ledgerJournals} jurnal.`;
      setMessage(pesan);
      notify(pesan);
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
          <EmptyState
            icon="lock"
            title="Halaman ini hanya untuk admin atau operator demo"
            description="Masuk dengan akun yang sesuai untuk membuka console demo."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-4" role="status">
            <StatusBanner tone="sukses">{message}</StatusBanner>
          </div>
        ) : null}

        {loading && allowed ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-64 w-full rounded-kartu" />
          </div>
        ) : null}

        {allowed && clock ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Waktu simulasi</h2>
              <p className="mt-2 text-base text-tinta-lembut">Sekarang</p>
              <p className="font-display text-2xl font-bold text-tinta">{tanggal(clock.now)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex min-h-8 items-center gap-1 rounded-pil bg-mint-muda px-3 text-base font-semibold text-teal-aksi">
                  <Icon name="clock" size={16} />
                  Kecepatan {clock.speed}×
                </span>
                <span className="inline-flex min-h-8 items-center gap-1 rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta">
                  Mode demo {clock.demoMode ? "aktif" : "mati"}
                </span>
              </div>

              <div className="mt-4">
                <Field label="Majukan berapa menit?" htmlFor="minutes">
                  {(props) => (
                    <input
                      {...props}
                      inputMode="numeric"
                      className={inputClass}
                      value={minutes}
                      onChange={(event) => setMinutes(event.target.value.replace(/\D/g, ""))}
                    />
                  )}
                </Field>
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
              <button
                type="button"
                className={`${primaryButtonClass} mt-3 w-full`}
                disabled={busy}
                aria-busy={busy}
                onClick={() => void majukan()}
              >
                Majukan waktu
              </button>

              <div className="mt-4">
                <Field label="Kecepatan waktu" htmlFor="speed">
                  {(props) => (
                    <input
                      {...props}
                      inputMode="numeric"
                      className={inputClass}
                      value={speed}
                      onChange={(event) => setSpeed(event.target.value.replace(/\D/g, ""))}
                    />
                  )}
                </Field>
              </div>
              <button
                type="button"
                className={`${secondaryButtonClass} mt-2 w-full`}
                disabled={busy}
                onClick={() => void ubahKecepatan()}
              >
                Simpan kecepatan
              </button>
              <button
                type="button"
                className={`${primaryButtonClass} mt-2 w-full`}
                disabled={busy}
                aria-busy={busy}
                onClick={() => void tick()}
              >
                {busy ? (
                  <>
                    <Icon name="refresh" size={18} className="animate-memuat" />
                    Memeriksa…
                  </>
                ) : (
                  "Jalankan pemeriksaan sekarang"
                )}
              </button>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Simulator pembayaran</h2>
              {pending.length === 0 ? (
                <EmptyState
                  icon="card"
                  title="Tidak ada tagihan yang menunggu"
                  description="Buat pesanan dari akun pembeli dulu. Tagihannya akan muncul di sini."
                  className="mt-3"
                />
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
                          <Icon name="check" size={18} />
                          Bayar
                        </button>
                        <button
                          type="button"
                          className={dangerButtonClass}
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
                          <Icon name="clock" size={18} />
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
                dan barang tetap. Jalankan <code className="font-semibold">npm run db:seed</code> untuk mengisi riwayat lagi.
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
                <button
                  type="button"
                  className={dangerButtonClass}
                  disabled={busy}
                  onClick={() => setKonfirmasiReset(true)}
                >
                  <Icon name="trash" size={18} />
                  Reset data transaksi
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={konfirmasiReset}
        title="Kosongkan semua data transaksi?"
        description="Pesanan, pembayaran, dompet, dan ledger akan dihapus. Data pengguna, toko, dan barang tetap ada. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, kosongkan"
        cancelLabel="Batal"
        danger
        onConfirm={() => void reset()}
        onCancel={() => setKonfirmasiReset(false)}
      />
    </main>
  );
}
