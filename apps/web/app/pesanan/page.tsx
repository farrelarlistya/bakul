"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatRupiah, type OrderInvoiceView } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { OrderStatusBadge } from "@/components/order-status";
import { SiteFooter } from "@/components/site-footer";
import { cardClass, errorBoxClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const FILTERS = [
  { key: "semua", label: "Semua", statuses: [] as string[] },
  { key: "bayar", label: "Perlu dibayar", statuses: ["WAITING_PAYMENT"] },
  {
    key: "proses",
    label: "Diproses",
    statuses: ["WAITING_SELLER_CONFIRMATION", "PROCESSING", "READY_TO_SHIP"],
  },
  { key: "kirim", label: "Dikirim", statuses: ["SHIPPED", "IN_TRANSIT"] },
  { key: "selesai", label: "Selesai", statuses: ["DELIVERED", "COMPLETED"] },
  {
    key: "masalah",
    label: "Bermasalah",
    statuses: [
      "DISPUTED",
      "REFUNDED",
      "RETURNING",
      "RETURNED",
      "CANCELLED_UNPAID",
      "CANCELLED_BY_SELLER",
    ],
  },
];

function tanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function PesananPage() {
  const { status, request } = useAuth();
  const [orders, setOrders] = useState<OrderInvoiceView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("semua");

  useEffect(() => {
    if (status !== "masuk") {
      return;
    }

    setLoading(true);
    void request<OrderInvoiceView[]>("/api/v1/orders")
      .then((items) => {
        setOrders(items);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Pesanan belum bisa dimuat.");
      })
      .finally(() => setLoading(false));
  }, [status, request]);

  const filtered = useMemo(() => {
    const active = FILTERS.find((item) => item.key === filter);
    if (!active || active.statuses.length === 0) {
      return orders;
    }
    return orders.filter((order) => active.statuses.includes(order.orderStatus));
  }, [orders, filter]);

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <CatalogHeader />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-base font-semibold text-teal-aksi">Belanjaanku</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Pesanan</h1>
        <p className="mt-1 text-base text-tinta-lembut">
          Setiap pesanan menunjukkan di mana uangmu berada.
        </p>

        {status === "tamu" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk melihat pesanan.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {status === "masuk" ? (
          <>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-pil px-4 text-base font-semibold ${
                    filter === item.key
                      ? "bg-teal-aksi text-putih"
                      : "bg-abu-kartu text-tinta"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {error ? (
              <div className={`${errorBoxClass} mt-4`} role="alert">
                {error}
              </div>
            ) : null}
            {loading ? <p className="mt-4 text-base text-tinta-lembut">Memuat pesanan…</p> : null}

            {!loading && filtered.length === 0 ? (
              <div className={`${cardClass} mt-6 text-center`}>
                <p className="text-lg font-semibold text-tinta">Belum ada pesanan di bagian ini.</p>
                <p className="mt-1 text-base text-tinta-lembut">
                  Cari barang dari pedagang kecil, lalu bayar dengan tenang.
                </p>
                <Link href="/cari" className={`${primaryButtonClass} mt-4`}>
                  Cari barang
                </Link>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {filtered.map((order) => (
                <article key={order.id} className={cardClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis pb-3">
                    <div>
                      <p className="text-base font-semibold text-tinta">{order.shop.name}</p>
                      <p className="text-base text-tinta-lembut">
                        {order.invoiceNumber} · {tanggal(order.createdAt)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>

                  <div className="mt-3 flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-tombol bg-mint-muda">
                      {order.firstItemImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.firstItemImage}
                          alt={order.firstItemName}
                          width={80}
                          height={80}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-base font-semibold text-tinta">
                        {order.firstItemName}
                      </p>
                      <p className="text-base text-tinta-lembut">
                        {order.itemCount} barang · {order.courierName} {order.courierServiceName}
                      </p>
                      <p className="mt-1 text-lg font-bold text-tinta">
                        {formatRupiah(order.totalAmount)}
                      </p>
                      <p className="text-base text-teal-aksi">
                        {order.escrowStatus === "FROZEN"
                          ? "Uang dibekukan selama komplain"
                          : order.escrowStatus === "RELEASED"
                            ? "Dana sudah diteruskan ke penjual"
                            : order.escrowStatus === "REFUNDED"
                              ? "Dana sudah dikembalikan"
                              : order.escrowStatus === "HELD"
                                ? "Uang ditahan aman"
                                : order.escrowStatus === "PENDING"
                                  ? "Menunggu pembayaran"
                                  : "Pesanan dibatalkan"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.orderStatus === "WAITING_PAYMENT" && order.payment ? (
                      <Link href={`/pembayaran/${order.payment.id}`} className={primaryButtonClass}>
                        Bayar sekarang
                      </Link>
                    ) : null}
                    <Link href={`/pesanan/${order.id}`} className={secondaryButtonClass}>
                      Lihat pesanan
                    </Link>
                    {order.shipment ? (
                      <Link href={`/lacak/${order.shipment.awb}`} className={secondaryButtonClass}>
                        Lacak paket
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
