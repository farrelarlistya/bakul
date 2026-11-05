"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatRupiah, type OrderInvoiceView } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { OrderStatusBadge } from "@/components/order-status";
import { SiteFooter } from "@/components/site-footer";
import { SkeletonRow } from "@/components/skeleton";
import {
  cardClass,
  chipActiveClass,
  chipClass,
  errorBoxClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
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

function posisiUang(order: OrderInvoiceView): string {
  if (order.escrowStatus === "FROZEN") {
    return "Uang dibekukan selama komplain";
  }
  if (order.escrowStatus === "RELEASED") {
    return "Dana sudah diteruskan ke penjual";
  }
  if (order.escrowStatus === "REFUNDED") {
    return "Dana sudah dikembalikan";
  }
  if (order.escrowStatus === "HELD") {
    return "Uang ditahan aman";
  }
  if (order.escrowStatus === "PENDING") {
    return "Menunggu pembayaran";
  }
  return "Pesanan dibatalkan";
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

  const activeFilter = FILTERS.find((item) => item.key === filter);
  const emptyTitle =
    filter === "semua"
      ? "Belum ada pesanan"
      : `Belum ada pesanan di bagian "${activeFilter?.label ?? ""}"`;
  const emptyDescription =
    filter === "semua"
      ? "Cari barang dari pedagang kecil, lalu bayar dengan tenang."
      : "Coba lihat tab lain untuk pesananmu yang sudah ada.";

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <p className="text-base font-semibold text-teal-aksi">Belanjaanku</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Pesanan</h1>
        <p className="mt-1 text-base text-tinta-lembut">
          Setiap pesanan menunjukkan di mana uangmu berada.
        </p>

        <div className="mt-3">
          <Link href="/lacak" className={secondaryButtonClass}>
            <Icon name="truck" size={18} />
            Lacak paket dengan nomor resi
          </Link>
        </div>

        {status === "tamu" ? (
          <EmptyState
            icon="user"
            title="Masuk dulu untuk melihat pesanan"
            description="Masuk dengan nomor HP, lalu riwayat pesananmu akan muncul di sini."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {status === "masuk" ? (
          <>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                  className={filter === item.key ? chipActiveClass : chipClass}
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

            {loading ? (
              <div className="mt-4 space-y-3">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <EmptyState
                icon="receipt"
                title={emptyTitle}
                description={emptyDescription}
                action={{ label: "Cari barang", href: "/cari" }}
                className="mt-6"
              />
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
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2 rounded-kartu bg-mint-muda p-3">
                    <Icon name="shield" size={20} className="mt-0.5 shrink-0 text-teal-aksi" />
                    <p className="text-base font-semibold leading-6 text-teal-tua">
                      {posisiUang(order)}
                    </p>
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
