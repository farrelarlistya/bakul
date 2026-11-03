"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatRupiah, type OrderInvoiceView } from "@bakul/shared";
import { OrderStatusBadge } from "@/components/order-status";
import { AppHeader } from "@/components/app-header";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

const FILTERS = [
  { key: "semua", label: "Semua", statuses: [] as string[] },
  { key: "baru", label: "Perlu diterima", statuses: ["WAITING_SELLER_CONFIRMATION"] },
  { key: "siap", label: "Disiapkan", statuses: ["PROCESSING", "READY_TO_SHIP"] },
  { key: "kirim", label: "Dikirim", statuses: ["SHIPPED", "IN_TRANSIT", "DELIVERED"] },
  { key: "selesai", label: "Selesai", statuses: ["COMPLETED"] },
  { key: "komplain", label: "Komplain", statuses: ["DISPUTED", "RETURNING"] },
];

function tanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function SellerOrdersPage() {
  const { status, user, request, download } = useAuth();
  const [orders, setOrders] = useState<OrderInvoiceView[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState("semua");

  async function load(): Promise<void> {
    setLoading(true);
    try {
      setOrders(await request<OrderInvoiceView[]>("/api/v1/seller/orders"));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesanan toko belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "masuk" && user?.shop) {
      void load();
    }
  }, [status, user?.shop]);

  const filtered = useMemo(() => {
    const active = FILTERS.find((item) => item.key === filter);
    if (!active || active.statuses.length === 0) {
      return orders;
    }
    return orders.filter((order) => active.statuses.includes(order.orderStatus));
  }, [orders, filter]);

  async function terima(order: OrderInvoiceView): Promise<void> {
    setBusy(order.id);
    try {
      await request(`/api/v1/seller/orders/${order.id}/accept`, { method: "POST" });
      setMessage(`Pesanan ${order.invoiceNumber} diterima. Siapkan barangnya.`);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesanan belum bisa diterima.");
    } finally {
      setBusy(null);
    }
  }

  async function tolak(order: OrderInvoiceView): Promise<void> {
    const reason = window.prompt("Alasan menolak pesanan ini?");
    if (!reason?.trim()) {
      return;
    }
    setBusy(order.id);
    try {
      await request(`/api/v1/seller/orders/${order.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setMessage("Pesanan ditolak dan uang pembeli dikembalikan.");
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesanan belum bisa ditolak.");
    } finally {
      setBusy(null);
    }
  }

  async function buatResi(order: OrderInvoiceView): Promise<void> {
    setBusy(order.id);
    try {
      const result = await request<{ awb: string; labelUrl: string }>(
        `/api/v1/seller/orders/${order.id}/awb`,
        { method: "POST" },
      );
      setMessage(`Resi ${result.awb} sudah dibuat. Unduh labelnya.`);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Resi belum bisa dibuat.");
    } finally {
      setBusy(null);
    }
  }

  async function unduhLabel(order: OrderInvoiceView): Promise<void> {
    try {
      await download(
        `/api/v1/seller/orders/${order.id}/label.pdf`,
        `label-${order.shipment?.awb ?? order.invoiceNumber}.pdf`,
      );
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Label belum bisa diunduh.");
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Toko kamu</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Pesanan masuk</h1>
            <p className="mt-2 text-base text-tinta-lembut">
              Terima, siapkan, cetak label, dan tanggapi komplain dari satu tempat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/jualan/barang" className={secondaryButtonClass}>
              Barang
            </Link>
            <Link href="/jualan/dompet" className={secondaryButtonClass}>
              Dompet
            </Link>
            <Link href="/jualan/toko" className={secondaryButtonClass}>
              Pengaturan toko
            </Link>
          </div>
        </div>

        {status === "memuat" ? (
          <p className="mt-6 text-base text-tinta-lembut">Memeriksa akun…</p>
        ) : null}
        {status === "tamu" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk melihat pesanan toko.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}
        {status === "masuk" && !user?.shop ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Kamu belum punya toko.</p>
            <Link href="/jualan" className={`${primaryButtonClass} mt-4 w-full`}>
              Buka toko
            </Link>
          </div>
        ) : null}

        {status === "masuk" && user?.shop ? (
          <>
            {error ? (
              <div className={`${errorBoxClass} mt-5`} role="alert">
                {error}
              </div>
            ) : null}
            {message ? (
              <p className="mt-5 rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">{message}</p>
            ) : null}

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-pil px-4 text-base font-semibold ${
                    filter === item.key ? "bg-teal-aksi text-putih" : "bg-putih text-tinta"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loading ? <p className="mt-3 text-base text-tinta-lembut">Memuat pesanan…</p> : null}

            {!loading && filtered.length === 0 ? (
              <div className={`${cardClass} mt-5`}>
                <p className="text-base text-tinta-lembut">Belum ada pesanan di bagian ini.</p>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {filtered.map((order) => (
                <article key={order.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-garis pb-3">
                    <div>
                      <p className="text-base font-semibold text-tinta">{order.invoiceNumber}</p>
                      <p className="text-base text-tinta-lembut">
                        {order.buyerName} · {tanggal(order.createdAt)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base text-tinta">
                        {order.itemCount} barang · {order.firstItemName}
                      </p>
                      <p className="text-base text-tinta-lembut">
                        {order.courierName} {order.courierServiceName} · {order.weightGram} g
                      </p>
                      <p className="mt-1 text-lg font-bold text-tinta">
                        {formatRupiah(order.totalAmount)}
                      </p>
                      {order.shipment ? (
                        <p className="text-base text-teal-aksi">Resi {order.shipment.awb}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.orderStatus === "WAITING_SELLER_CONFIRMATION" ? (
                        <>
                          <button
                            type="button"
                            className={primaryButtonClass}
                            disabled={busy === order.id}
                            onClick={() => void terima(order)}
                          >
                            Terima
                          </button>
                          <button
                            type="button"
                            className={dangerButtonClass}
                            disabled={busy === order.id}
                            onClick={() => void tolak(order)}
                          >
                            Tolak
                          </button>
                        </>
                      ) : null}

                      {order.orderStatus === "PROCESSING" ? (
                        <button
                          type="button"
                          className={primaryButtonClass}
                          disabled={busy === order.id}
                          onClick={() => void buatResi(order)}
                        >
                          Buat resi
                        </button>
                      ) : null}

                      {order.shipment ? (
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={() => void unduhLabel(order)}
                        >
                          Unduh label
                        </button>
                      ) : null}

                      <Link href={`/jualan/pesanan/${order.id}`} className={secondaryButtonClass}>
                        Lihat detail
                      </Link>
                    </div>
                  </div>

                  <p className="mt-2 text-base text-tinta-lembut">
                    {order.orderStatus === "WAITING_SELLER_CONFIRMATION"
                      ? "Siapkan barang dalam 48 jam. Kalau lewat, pesanan batal otomatis dan uang kembali."
                      : order.orderStatus === "PROCESSING"
                        ? "Barang sedang disiapkan. Buat resi setelah paket siap."
                        : order.escrowStatus === "HELD"
                          ? "Uang ditahan aman di Bakul."
                          : order.escrowStatus === "FROZEN"
                            ? "Uang dibekukan karena komplain."
                            : "Dana sudah diselesaikan."}
                  </p>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
