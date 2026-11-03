"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PAYMENT_STATUS_LABEL,
  formatRupiah,
  type PaymentInstruction,
  type PaymentView,
} from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { OrderStatusBadge } from "@/components/order-status";
import { SiteFooter } from "@/components/site-footer";
import {
  cardClass,
  errorBoxClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

function sisaWaktu(ms: number): string {
  if (ms <= 0) {
    return "00:00:00";
  }
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function PaymentClient({ paymentId }: { paymentId: string }) {
  const { status, request } = useAuth();
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [instruction, setInstruction] = useState<PaymentInstruction | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [view, guide] = await Promise.all([
        request<PaymentView>(`/api/v1/payments/${paymentId}`),
        request<PaymentInstruction>(`/api/v1/payments/${paymentId}/instructions`),
      ]);
      setPayment(view);
      setInstruction(guide);
      setRemaining(
        Math.max(0, new Date(guide.expiresAt).getTime() - new Date(guide.serverNow).getTime()),
      );
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Tagihan belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [paymentId, request]);

  useEffect(() => {
    if (status === "masuk") {
      void load();
    }
  }, [status, load]);

  useEffect(() => {
    if (status !== "masuk") {
      return;
    }
    const timer = setInterval(() => {
      void load();
    }, 4000);
    return () => clearInterval(timer);
  }, [status, load]);

  useEffect(() => {
    if (!instruction || !payment || payment.status !== "PENDING") {
      return;
    }

    const speed = Math.max(1, instruction.speed);
    const timer = setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1000 * speed));
    }, 1000);
    return () => clearInterval(timer);
  }, [instruction, payment]);

  async function salin(): Promise<void> {
    if (!instruction) {
      return;
    }
    try {
      await navigator.clipboard.writeText(instruction.paymentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kode belum bisa disalin. Tulis manual dari layar ini.");
    }
  }

  async function simulasiBayar(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await request(`/api/v1/payments/${paymentId}/simulate`, { method: "POST" });
      await new Promise((resolve) => setTimeout(resolve, 2200));
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pembayaran belum bisa disimulasikan.");
    } finally {
      setBusy(false);
    }
  }

  const paid = payment?.status === "PAID";

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <CatalogHeader />

      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-base font-semibold text-teal-aksi">Pembayaran</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
          {paid ? "Pembayaran berhasil" : "Selesaikan pembayaran"}
        </h1>

        {status === "tamu" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk melihat tagihan.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {loading && !payment ? (
          <p className="mt-4 text-base text-tinta-lembut">Memuat tagihan…</p>
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}

        {payment && instruction ? (
          <div className="mt-5 space-y-5">
            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base text-tinta-lembut">Total bayar</p>
                  <p className="text-3xl font-bold text-tinta">
                    {formatRupiah(payment.totalAmount)}
                  </p>
                </div>
                <span className="rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta">
                  {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                </span>
              </div>

              {payment.status === "PENDING" ? (
                <div className="mt-4 rounded-kartu bg-krem p-3">
                  <p className="text-base text-tinta-lembut">Bayar sebelum waktu habis</p>
                  <p className="mt-1 text-2xl font-bold text-tinta">{sisaWaktu(remaining)}</p>
                  {remaining <= 0 ? (
                    <p className="mt-1 text-base text-bahaya">
                      Waktu habis. Pesanan akan dibatalkan dan stok dikembalikan.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {paid ? (
                <div className="mt-4 rounded-kartu bg-mint-muda p-4">
                  <p className="text-lg font-semibold text-teal-aksi">
                    Uang kamu sudah ditahan aman.
                  </p>
                  <p className="mt-1 text-base text-tinta">
                    Penjual sudah dikabari. Dana diteruskan setelah barang diterima.
                  </p>
                </div>
              ) : null}

              <div className="mt-5">
                <p className="text-base text-tinta-lembut">{instruction.methodLabel}</p>
                {instruction.qrDataUrl ? (
                  <div className="mt-2 flex flex-col items-center gap-2 rounded-kartu border border-garis p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={instruction.qrDataUrl}
                      alt="QRIS simulasi"
                      width={220}
                      height={220}
                      className="h-56 w-56"
                    />
                    <p className="text-base font-semibold text-tinta">QRIS SIMULASI</p>
                    <p className="text-base text-tinta-lembut">
                      Tidak ada uang nyata yang berpindah.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-3 rounded-kartu border border-garis p-4">
                    <p className="break-all text-2xl font-bold tracking-wide text-tinta">
                      {instruction.paymentCode}
                    </p>
                    <button type="button" className={secondaryButtonClass} onClick={() => void salin()}>
                      {copied ? "Tersalin" : "Salin kode"}
                    </button>
                  </div>
                )}
              </div>

              <ol className="mt-5 space-y-2">
                {instruction.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-base text-tinta">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pil bg-mint text-teal-aksi">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              {payment.status === "PENDING" ? (
                <button
                  type="button"
                  className={`${primaryButtonClass} mt-5 w-full`}
                  disabled={busy}
                  onClick={() => void simulasiBayar()}
                >
                  {busy ? "Memeriksa pembayaran…" : "Saya sudah bayar (demo)"}
                </button>
              ) : null}

              {payment.status === "PENDING" ? (
                <p className="mt-2 text-base text-tinta-lembut">
                  Mode demo: tombol di atas mensimulasikan pembayaran berhasil.
                </p>
              ) : null}
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Pesanan di tagihan ini</h2>
              <ul className="mt-3 space-y-3">
                {payment.invoices.map((invoice) => (
                  <li key={invoice.id} className="rounded-kartu border border-garis p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-tinta">{invoice.invoiceNumber}</p>
                        <p className="text-base text-tinta-lembut">{invoice.shopName}</p>
                      </div>
                      <OrderStatusBadge status={invoice.orderStatus} />
                    </div>
                    <p className="mt-2 text-base font-semibold text-tinta">
                      {formatRupiah(invoice.totalAmount)}
                    </p>
                  </li>
                ))}
              </ul>

              {paid ? (
                <Link href="/pesanan" className={`${primaryButtonClass} mt-4 w-full`}>
                  Lihat pesanan
                </Link>
              ) : (
                <Link href="/keranjang" className={`${secondaryButtonClass} mt-4 w-full`}>
                  Kembali ke keranjang
                </Link>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
