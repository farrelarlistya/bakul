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
import { AppHeader } from "@/components/app-header";
import { CopyButton } from "@/components/copy-button";
import { Icon } from "@/components/icon";
import { OrderStatusBadge } from "@/components/order-status";
import { SiteFooter } from "@/components/site-footer";
import { Skeleton } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
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
  const hampirHabis = payment?.status === "PENDING" && remaining <= 5 * 60 * 1000;

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader />

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
          <div className="mt-4 space-y-3">
            <Skeleton className="h-32 w-full rounded-kartu" />
            <Skeleton className="h-56 w-full rounded-kartu" />
          </div>
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
                <span
                  className={`inline-flex min-h-8 items-center gap-1 rounded-pil px-3 text-base font-semibold ${
                    paid
                      ? "bg-mint-muda text-teal-aksi"
                      : payment.status === "PENDING"
                        ? "bg-krem text-perhatian-tua"
                        : "bg-abu-kartu text-tinta"
                  }`}
                >
                  {paid ? (
                    <Icon name="check" size={16} />
                  ) : (
                    <Icon name="clock" size={16} />
                  )}
                  {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                </span>
              </div>

              {payment.status === "PENDING" ? (
                <div
                  className={`mt-4 rounded-kartu border p-3 ${
                    hampirHabis ? "border-bahaya bg-bahaya-muda" : "border-garis-kuat bg-krem"
                  }`}
                >
                  <p
                    className={`flex items-center gap-1 text-base ${
                      hampirHabis ? "text-bahaya" : "text-tinta-lembut"
                    }`}
                  >
                    <Icon name="clock" size={18} />
                    Bayar sebelum waktu habis
                  </p>
                  <p
                    aria-live="polite"
                    className={`mt-1 font-display text-3xl font-bold ${
                      hampirHabis ? "text-bahaya" : "text-tinta"
                    }`}
                  >
                    {sisaWaktu(remaining)}
                  </p>
                  {remaining <= 0 ? (
                    <p className="mt-1 text-base text-bahaya">
                      Waktu habis. Pesanan akan dibatalkan dan stok dikembalikan.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {paid ? (
                <div className="mt-4">
                  <StatusBanner tone="sukses" title="Uang kamu sudah ditahan aman.">
                    Penjual sudah dikabari. Dana diteruskan setelah barang diterima.
                  </StatusBanner>
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
                    <CopyButton value={instruction.paymentCode} />
                  </div>
                )}
              </div>

              <ol className="mt-5 space-y-3">
                {instruction.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-base text-tinta">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pil bg-mint text-base font-bold text-teal-tua">
                      {index + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>

              {payment.status === "PENDING" ? (
                <button
                  type="button"
                  className={`${primaryButtonClass} mt-5 w-full`}
                  disabled={busy}
                  aria-busy={busy}
                  onClick={() => void simulasiBayar()}
                >
                  {busy ? (
                    <>
                      <Icon name="refresh" size={18} className="animate-memuat" />
                      Memeriksa pembayaran…
                    </>
                  ) : (
                    "Saya sudah bayar (demo)"
                  )}
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
