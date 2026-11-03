"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  DISPUTE_STATUS_LABEL,
  ESCROW_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  formatRupiah,
  type OrderInvoiceView,
} from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { OrderStatusBadge } from "@/components/order-status";
import { SiteFooter } from "@/components/site-footer";
import {
  cardClass,
  errorBoxClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

function tanggal(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OrderDetailClient({ invoiceId }: { invoiceId: string }) {
  const { status, request } = useAuth();
  const [order, setOrder] = useState<OrderInvoiceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewEvidence, setReviewEvidence] = useState<string[]>([]);
  const [reviewUploadBusy, setReviewUploadBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await request<OrderInvoiceView>(`/api/v1/orders/${invoiceId}`));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesanan belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId, request]);

  useEffect(() => {
    if (status === "masuk") {
      void load();
    }
  }, [status, load]);

  async function selesaikan(): Promise<void> {
    if (!window.confirm("Barang sudah diterima dengan baik? Dana akan diteruskan ke penjual.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await request(`/api/v1/orders/${invoiceId}/complete`, { method: "POST" });
      setMessage("Pesanan selesai. Dana sudah diteruskan ke penjual.");
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesanan belum bisa diselesaikan.");
    } finally {
      setBusy(false);
    }
  }

  async function kirimUlasan(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await request(`/api/v1/orders/${invoiceId}/review`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          mediaUrls: reviewEvidence.length > 0 ? reviewEvidence : undefined,
        }),
      });
      setMessage("Terima kasih, ulasanmu sudah dikirim.");
      setReviewEvidence([]);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Ulasan belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  async function unggahFotoUlasan(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setReviewUploadBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", file);
      const result = await request<{ url: string }>(
        `/api/v1/orders/${invoiceId}/review/evidence`,
        { method: "POST", body: form },
      );
      setReviewEvidence((current) => [...current, result.url].slice(0, 3));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Foto ulasan belum bisa diunggah.");
    } finally {
      setReviewUploadBusy(false);
      event.target.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <CatalogHeader />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link href="/pesanan" className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi">
          ← Kembali ke pesanan
        </Link>

        {status === "tamu" ? (
          <div className={`${cardClass} mt-4`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk melihat pesanan.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {loading ? <p className="mt-4 text-base text-tinta-lembut">Memuat pesanan…</p> : null}
        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">{message}</p>
        ) : null}

        {order ? (
          <div className="mt-4 space-y-5">
            <section className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base text-tinta-lembut">{order.invoiceNumber}</p>
                  <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
                    {order.shop.name}
                  </h1>
                  <p className="text-base text-tinta-lembut">{tanggal(order.createdAt)}</p>
                </div>
                <OrderStatusBadge status={order.orderStatus} />
              </div>

              <div className="mt-4 rounded-kartu bg-krem p-4">
                <p className="text-lg font-semibold text-tinta">
                  {ESCROW_STATUS_LABEL[order.escrowStatus] ?? order.escrowStatus}
                </p>
                <p className="mt-1 text-base text-tinta">
                  {order.escrowStatus === "HELD"
                    ? "Uangmu aman di Bakul. Penjual baru menerima setelah kamu menekan Pesanan Selesai atau pesanan selesai otomatis."
                    : order.escrowStatus === "FROZEN"
                      ? "Uang ditahan selama komplain diperiksa. Tidak ada dana yang diteruskan dulu."
                      : order.escrowStatus === "RELEASED"
                        ? "Dana sudah diteruskan ke penjual karena pesanan selesai."
                        : order.escrowStatus === "REFUNDED" || order.escrowStatus === "PARTIALLY_REFUNDED"
                          ? "Dana sudah dikembalikan sesuai keputusan."
                          : "Belum ada uang yang masuk ke Bakul."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.orderStatus === "WAITING_PAYMENT" && order.payment ? (
                  <Link href={`/pembayaran/${order.payment.id}`} className={primaryButtonClass}>
                    Bayar sekarang
                  </Link>
                ) : null}
                {order.canComplete ? (
                  <button
                    type="button"
                    className={primaryButtonClass}
                    disabled={busy}
                    onClick={() => void selesaikan()}
                  >
                    Pesanan selesai
                  </button>
                ) : null}
                {order.canDispute ? (
                  <Link href={`/pesanan/${order.id}/komplain`} className={secondaryButtonClass}>
                    Ajukan komplain
                  </Link>
                ) : null}
                {order.dispute ? (
                  <Link href={`/pesanan/${order.id}/komplain`} className={secondaryButtonClass}>
                    Buka komplain
                  </Link>
                ) : null}
                {order.shipment ? (
                  <Link href={`/lacak/${order.shipment.awb}`} className={secondaryButtonClass}>
                    Lacak paket
                  </Link>
                ) : null}
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Barang</h2>
              <ul className="mt-3 divide-y divide-garis">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-3 py-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-tombol bg-mint-muda">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          width={64}
                          height={64}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.productSlug ? (
                        <Link href={`/p/${item.productSlug}`} className="text-base font-semibold text-tinta">
                          {item.name}
                        </Link>
                      ) : (
                        <p className="text-base font-semibold text-tinta">{item.name}</p>
                      )}
                      <p className="text-base text-tinta-lembut">
                        {item.variant} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-tinta">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-3 space-y-2 border-t border-garis pt-3 text-base">
                <div className="flex justify-between gap-3">
                  <dt className="text-tinta-lembut">Barang</dt>
                  <dd className="font-semibold text-tinta">{formatRupiah(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-tinta-lembut">
                    Ongkir {order.courierName} {order.courierServiceName}
                  </dt>
                  <dd className="font-semibold text-tinta">{formatRupiah(order.shippingCost)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-tinta-lembut">Biaya layanan</dt>
                  <dd className="font-semibold text-tinta">{formatRupiah(order.serviceFee)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-garis pt-2">
                  <dt className="text-lg font-semibold text-tinta">Total</dt>
                  <dd className="text-xl font-bold text-tinta">{formatRupiah(order.totalAmount)}</dd>
                </div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Pengiriman</h2>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-base font-semibold text-tinta">{order.recipient.name}</p>
                  <p className="text-base text-tinta-lembut">{order.recipient.phone}</p>
                  <p className="text-base text-tinta">
                    {order.recipient.fullAddress}, {order.recipient.districtName ?? ""}{" "}
                    {order.recipient.cityName} {order.recipient.postalCode}
                  </p>
                </div>
                <div>
                  <p className="text-base text-tinta-lembut">Kurir</p>
                  <p className="text-base font-semibold text-tinta">
                    {order.courierName} {order.courierServiceName}
                  </p>
                  {order.shipment ? (
                    <>
                      <p className="mt-2 text-base text-tinta-lembut">Nomor resi</p>
                      <Link
                        href={`/lacak/${order.shipment.awb}`}
                        className="text-base font-semibold text-teal-aksi underline"
                      >
                        {order.shipment.awb}
                      </Link>
                    </>
                  ) : (
                    <p className="mt-2 text-base text-tinta-lembut">Resi belum dibuat penjual.</p>
                  )}
                </div>
              </div>
              {order.notes ? (
                <p className="mt-3 rounded-kartu bg-abu-kartu p-3 text-base text-tinta">
                  Catatan: {order.notes}
                </p>
              ) : null}
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Pembayaran</h2>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-base text-tinta">
                  {order.payment?.methodLabel ?? "Cara bayar"} ·{" "}
                  {PAYMENT_STATUS_LABEL[order.payment?.status ?? ""] ?? order.payment?.status}
                </p>
                {order.payment?.status === "PENDING" ? (
                  <Link href={`/pembayaran/${order.payment.id}`} className={secondaryButtonClass}>
                    Lihat tagihan
                  </Link>
                ) : null}
              </div>
              <p className="mt-2 text-base text-tinta-lembut">
                Dibayar: {tanggal(order.paidAt)}
              </p>
            </section>

            {order.dispute ? (
              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Komplain</h2>
                <p className="mt-2 text-base text-tinta">{order.dispute.reason}</p>
                <p className="mt-1 text-base text-tinta-lembut">
                  Status: {DISPUTE_STATUS_LABEL[order.dispute.status] ?? order.dispute.status}
                </p>
                <Link href={`/pesanan/${order.id}/komplain`} className={`${secondaryButtonClass} mt-3`}>
                  Lihat ruang diskusi
                </Link>
              </section>
            ) : null}

            {order.canReview ? (
              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Beri ulasan</h2>
                <p className="mt-1 text-base text-tinta-lembut">
                  Ulasan membantu pembeli lain memilih pedagang yang tepat.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-tombol border text-xl ${
                        rating >= value
                          ? "border-perhatian bg-[#fff7e6] text-perhatian"
                          : "border-garis bg-putih text-tinta-lembut"
                      }`}
                      aria-label={`${value} bintang`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <label className={`${labelClass} mt-4`} htmlFor="review-comment">
                  Ceritakan pengalamanmu (opsional)
                </label>
                <textarea
                  id="review-comment"
                  className={`${inputClass} min-h-24 py-3`}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={1000}
                />
                <label className={`${labelClass} mt-3`} htmlFor="review-photo">
                  Foto barang (opsional, maksimal 3)
                </label>
                <input
                  id="review-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block min-h-11 w-full text-base text-tinta"
                  disabled={reviewUploadBusy || reviewEvidence.length >= 3}
                  onChange={(event) => void unggahFotoUlasan(event)}
                />
                {reviewEvidence.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {reviewEvidence.map((url) => (
                      <li key={url} className="h-16 w-16 overflow-hidden rounded-tombol border border-garis">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Foto ulasan" width={64} height={64} className="h-full w-full object-cover" />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  className={`${primaryButtonClass} mt-3 w-full`}
                  disabled={busy || reviewUploadBusy}
                  onClick={() => void kirimUlasan()}
                >
                  {busy ? "Mengirim…" : "Kirim ulasan"}
                </button>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
