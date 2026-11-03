"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  DISPUTE_SOLUTION_LABEL,
  DISPUTE_STATUS_LABEL,
  ESCROW_STATUS_LABEL,
  formatRupiah,
  type OrderInvoiceView,
} from "@bakul/shared";
import { OrderStatusBadge } from "@/components/order-status";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { PromptDialog } from "@/components/prompt-dialog";
import { Skeleton } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
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

const ALUR = [
  { key: "WAITING_SELLER_CONFIRMATION", label: "Diterima" },
  { key: "PROCESSING", label: "Disiapkan" },
  { key: "READY_TO_SHIP", label: "Resi dibuat" },
  { key: "SHIPPED", label: "Dikirim" },
];

export function SellerOrderDetailClient({ invoiceId }: { invoiceId: string }) {
  const { status, request, download } = useAuth();
  const { notify } = useToast();
  const [order, setOrder] = useState<OrderInvoiceView | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [konfirmasiRefund, setKonfirmasiRefund] = useState(false);
  const [tolakDialog, setTolakDialog] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await request<OrderInvoiceView>(`/api/v1/seller/orders/${invoiceId}`));
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

  async function aksi(path: string, body?: unknown, success?: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await request(path, {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (success) {
        setMessage(success);
        notify(success);
      }
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Aksi belum berhasil.");
    } finally {
      setBusy(false);
    }
  }

  async function tolak(reason: string): Promise<void> {
    setTolakDialog(false);
    await aksi(
      `/api/v1/seller/orders/${invoiceId}/reject`,
      { reason },
      "Pesanan ditolak dan uang pembeli dikembalikan.",
    );
  }

  async function buatResi(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const result = await request<{ awb: string }>(
        `/api/v1/seller/orders/${invoiceId}/awb`,
        { method: "POST" },
      );
      setMessage(`Resi ${result.awb} sudah dibuat.`);
      notify(`Resi ${result.awb} sudah dibuat.`);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Resi belum bisa dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function kirimBalasan(): Promise<void> {
    if (!reply.trim()) {
      return;
    }
    await aksi(
      `/api/v1/orders/${invoiceId}/dispute/messages`,
      { body: reply.trim() },
      "Balasan terkirim.",
    );
    setReply("");
  }

  async function setujuiRefund(): Promise<void> {
    setKonfirmasiRefund(false);
    await aksi(
      `/api/v1/seller/orders/${invoiceId}/dispute/refund`,
      undefined,
      "Pengembalian uang disetujui.",
    );
  }

  const langkahSekarang = order
    ? ALUR.findIndex((step) => step.key === order.orderStatus)
    : -1;

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/jualan/pesanan"
          className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
        >
          <Icon name="arrowLeft" size={18} />
          Kembali ke pesanan masuk
        </Link>

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-48 w-full rounded-kartu" />
            <Skeleton className="h-64 w-full rounded-kartu" />
          </div>
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

        {order ? (
          <div className="mt-4 space-y-4">
            <section className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base text-tinta-lembut">{order.invoiceNumber}</p>
                  <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
                    {order.buyerName}
                  </h1>
                  <p className="text-base text-tinta-lembut">{tanggal(order.createdAt)}</p>
                </div>
                <OrderStatusBadge status={order.orderStatus} />
              </div>

              <ol className="mt-4 flex items-center gap-1" aria-label="Alur pesanan">
                {ALUR.map((step, index) => {
                  const selesai = langkahSekarang >= index && langkahSekarang >= 0;
                  const aktif = langkahSekarang === index;
                  return (
                    <li key={step.key} className="flex flex-1 flex-col gap-1">
                      <span
                        className={`h-1.5 w-full rounded-pil ${
                          selesai ? "bg-teal-aksi" : "bg-garis"
                        }`}
                      />
                      <span
                        className={`text-base leading-5 ${
                          aktif
                            ? "font-semibold text-teal-aksi"
                            : selesai
                              ? "text-tinta"
                              : "text-tinta-lembut"
                        }`}
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-4 flex items-start gap-2 rounded-kartu border border-teal bg-mint-muda p-3 text-base text-tinta">
                <Icon name="shield" size={20} className="mt-0.5 shrink-0 text-teal-aksi" />
                {ESCROW_STATUS_LABEL[order.escrowStatus] ?? order.escrowStatus}.{" "}
                {order.escrowStatus === "HELD"
                  ? "Uang pembeli sudah aman di Bakul."
                  : order.escrowStatus === "FROZEN"
                    ? "Dana dibekukan sampai komplain selesai."
                    : order.escrowStatus === "RELEASED"
                      ? "Dana sudah masuk ke dompet toko."
                      : ""}
              </p>

              {order.orderStatus === "WAITING_SELLER_CONFIRMATION" ? (
                <p className="mt-3 inline-flex min-h-8 items-center gap-1 rounded-pil bg-krem px-3 text-base font-semibold text-perhatian-tua">
                  <Icon name="clock" size={16} />
                  Tanggapi sebelum {tanggal(order.sellerConfirmDeadline)}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {order.orderStatus === "WAITING_SELLER_CONFIRMATION" ? (
                  <>
                    <button
                      type="button"
                      className={primaryButtonClass}
                      disabled={busy}
                      onClick={() =>
                        void aksi(
                          `/api/v1/seller/orders/${invoiceId}/accept`,
                          undefined,
                          "Pesanan diterima. Siapkan barangnya.",
                        )
                      }
                    >
                      Terima pesanan
                    </button>
                    <button
                      type="button"
                      className={dangerButtonClass}
                      disabled={busy}
                      onClick={() => setTolakDialog(true)}
                    >
                      Tolak
                    </button>
                  </>
                ) : null}
                {order.orderStatus === "PROCESSING" ? (
                  <button
                    type="button"
                    className={primaryButtonClass}
                    disabled={busy}
                    onClick={() => void buatResi()}
                  >
                    Buat resi
                  </button>
                ) : null}
                {order.shipment ? (
                  <>
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() =>
                        void download(
                          `/api/v1/seller/orders/${invoiceId}/label.pdf`,
                          `label-${order.shipment?.awb ?? order.invoiceNumber}.pdf`,
                        )
                      }
                    >
                      <Icon name="download" size={18} />
                      Unduh label PDF
                    </button>
                    <Link href={`/lacak/${order.shipment.awb}`} className={secondaryButtonClass}>
                      Lacak {order.shipment.awb}
                    </Link>
                  </>
                ) : null}
              </div>
              <p className="mt-2 text-base text-tinta-lembut">
                {order.orderStatus === "WAITING_SELLER_CONFIRMATION"
                  ? `Tanggapi sebelum ${tanggal(order.sellerConfirmDeadline)}. Kalau lewat, pesanan batal otomatis.`
                  : order.orderStatus === "PROCESSING"
                    ? "Kalau barang sudah siap, buat resi lalu cetak label."
                    : order.orderStatus === "READY_TO_SHIP"
                      ? "Resi sudah dibuat. Serahkan paket ke kurir."
                      : ""}
              </p>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Kirim ke</h2>
              <p className="mt-2 text-base font-semibold text-tinta">{order.recipient.name}</p>
              <p className="text-base text-tinta-lembut">{order.recipient.phone}</p>
              <p className="text-base text-tinta">
                {order.recipient.fullAddress}, {order.recipient.districtName ?? ""}{" "}
                {order.recipient.cityName} {order.recipient.postalCode}
              </p>
              <p className="mt-2 text-base text-tinta">
                {order.courierName} {order.courierServiceName} · {order.weightGram} g
              </p>
              {order.notes ? (
                <p className="mt-2 rounded-kartu bg-abu-kartu p-3 text-base text-tinta">
                  Catatan pembeli: {order.notes}
                </p>
              ) : null}
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Barang</h2>
              <ul className="mt-3 divide-y divide-garis">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-3 py-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-tombol bg-mint-muda">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} width={56} height={56} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-tinta">{item.name}</p>
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
              <div className="mt-3 border-t border-garis pt-3 text-base">
                <p className="flex justify-between gap-3">
                  <span className="text-tinta-lembut">Total dibayar pembeli</span>
                  <span className="font-semibold text-tinta">{formatRupiah(order.totalAmount)}</span>
                </p>
                <p className="mt-1 flex justify-between gap-3">
                  <span className="text-tinta-lembut">Masuk ke dompet setelah selesai</span>
                  <span className="font-semibold text-tinta">
                    {formatRupiah(order.subtotal + order.shippingCost - Math.round(order.subtotal * 0.02))}
                  </span>
                </p>
              </div>
            </section>

            {order.dispute ? (
              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Komplain pembeli</h2>
                <p className="mt-2 text-base text-tinta">{order.dispute.reason}</p>
                <p className="mt-1 text-base text-tinta-lembut">
                  Diminta: {DISPUTE_SOLUTION_LABEL[order.dispute.requestedSolution] ?? order.dispute.requestedSolution}
                </p>
                <p className="mt-1 text-base text-tinta-lembut">
                  Status: {DISPUTE_STATUS_LABEL[order.dispute.status] ?? order.dispute.status}
                </p>

                {order.dispute.messages.length === 0 ? (
                  <EmptyState
                    icon="chat"
                    title="Belum ada balasan"
                    description="Tulis pesan untuk pembeli agar mereka tahu kamu sedang menangani masalahnya."
                    className="mt-3"
                  />
                ) : (
                  <ul className="mt-3 space-y-2">
                    {order.dispute.messages.map((item) => (
                      <li key={item.id} className="rounded-kartu border border-garis bg-abu-kartu p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-base font-semibold text-tinta">{item.senderName}</p>
                          <p className="text-base text-tinta-lembut">{tanggal(item.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-base text-tinta">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {!["RESOLVED_BUYER", "RESOLVED_SELLER", "CLOSED", "CANCELLED_BY_BUYER"].includes(
                  order.dispute.status,
                ) ? (
                  <>
                    <label className={`${labelClass} mt-4`} htmlFor="seller-reply">
                      Balas pembeli
                    </label>
                    <textarea
                      id="seller-reply"
                      className={`${inputClass} min-h-20 py-3`}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      maxLength={2000}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={primaryButtonClass}
                        disabled={busy || !reply.trim()}
                        onClick={() => void kirimBalasan()}
                      >
                        Kirim balasan
                      </button>
                      <button
                        type="button"
                        className={dangerButtonClass}
                        disabled={busy}
                        onClick={() => setKonfirmasiRefund(true)}
                      >
                        Setujui uang kembali
                      </button>
                    </div>
                  </>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={konfirmasiRefund}
        title="Setujui pengembalian uang penuh?"
        description="Tindakan ini tidak bisa dibatalkan. Uang pembeli akan dikembalikan dari dompet toko."
        confirmLabel="Ya, setujui"
        cancelLabel="Batal"
        danger
        onConfirm={() => void setujuiRefund()}
        onCancel={() => setKonfirmasiRefund(false)}
      />

      <PromptDialog
        open={tolakDialog}
        title="Tolak pesanan ini?"
        description="Uang pembeli akan dikembalikan. Tulis alasannya supaya pembeli tahu."
        label="Alasan menolak"
        placeholder="Contoh: Stok barang ini habis"
        confirmLabel="Ya, tolak pesanan"
        onConfirm={(reason) => void tolak(reason)}
        onCancel={() => setTolakDialog(false)}
      />
    </main>
  );
}
