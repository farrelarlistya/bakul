"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ORDER_STATUS_LABEL,
  formatRupiah,
  type AdminMetrics,
} from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { MetricCard } from "@/components/metric-card";
import { Skeleton } from "@/components/skeleton";
import {
  cardClass,
  errorBoxClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

function tanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminPage() {
  const { status, user, request } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "masuk" || user?.role !== "ADMIN") {
      setLoading(false);
      return;
    }
    setLoading(true);
    void request<AdminMetrics>("/api/v1/admin/metrics")
      .then((data) => {
        setMetrics(data);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Ringkasan belum bisa dimuat.");
      })
      .finally(() => setLoading(false));
  }, [status, user?.role, request]);

  const totalStatus = metrics?.ordersByStatus.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Tim Bakul</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Dashboard admin</h1>
            <p className="mt-2 text-base text-tinta-lembut">
              Semua angka di sini simulasi. Tidak ada uang nyata.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/komplain" className={secondaryButtonClass}>
              Komplain
            </Link>
            <Link href="/admin/pencairan" className={secondaryButtonClass}>
              Pencairan
            </Link>
            <Link href="/admin/toko" className={secondaryButtonClass}>
              Toko & barang
            </Link>
            <Link href="/dev" className={secondaryButtonClass}>
              Demo console
            </Link>
          </div>
        </div>

        {status === "tamu" || (status === "masuk" && user?.role !== "ADMIN") ? (
          <EmptyState
            icon="lock"
            title="Halaman ini hanya untuk admin"
            description="Masuk dengan akun admin untuk melihat ringkasan."
            action={{ label: "Masuk sebagai admin", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}

        {loading && !metrics ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-28 w-full rounded-kartu" />
            <Skeleton className="h-64 w-full rounded-kartu" />
          </div>
        ) : null}

        {metrics ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Nilai transaksi"
                value={formatRupiah(metrics.gmv)}
                icon="chart"
                tone="teal"
                emphasis
              />
              <MetricCard
                label="Uang ditahan aman"
                value={formatRupiah(metrics.escrowHeld)}
                icon="shield"
                emphasis
              />
              <MetricCard
                label="Pendapatan platform"
                value={formatRupiah(metrics.revenue)}
                icon="wallet"
                emphasis
              />
              <MetricCard
                label="Pesanan selesai"
                value={`${metrics.completedOrders} dari ${metrics.orderCount}`}
                icon="receipt"
                emphasis
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Toko aktif" value={String(metrics.activeShops)} icon="store" />
              <MetricCard label="Barang aktif" value={String(metrics.activeProducts)} icon="package" />
              <MetricCard label="Menunggu penjual" value={String(metrics.waitingSeller)} icon="clock" />
              <MetricCard
                label="Perlu diputuskan"
                value={`${metrics.openDisputes} komplain · ${metrics.pendingWithdrawals} pencairan`}
                icon="warning"
                tone={metrics.openDisputes + metrics.pendingWithdrawals > 0 ? "krem" : "netral"}
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Pesanan per status</h2>
                {metrics.ordersByStatus.length === 0 ? (
                  <EmptyState
                    icon="receipt"
                    title="Belum ada pesanan"
                    description="Status pesanan akan muncul di sini."
                    className="mt-3"
                  />
                ) : (
                  <ul className="mt-4 space-y-3">
                    {metrics.ordersByStatus
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((row) => {
                        const persen = totalStatus > 0 ? Math.round((row.count / totalStatus) * 100) : 0;
                        return (
                          <li key={row.status}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-base text-tinta">
                                {ORDER_STATUS_LABEL[row.status] ?? row.status}
                              </span>
                              <span className="text-base font-semibold text-tinta">
                                {row.count}
                              </span>
                            </div>
                            <div
                              className="mt-1 h-2 w-full overflow-hidden rounded-pil bg-abu-kartu"
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={totalStatus}
                              aria-valuenow={row.count}
                              aria-label={`${ORDER_STATUS_LABEL[row.status] ?? row.status}: ${row.count} pesanan`}
                            >
                              <div
                                className="h-full rounded-pil bg-teal-aksi transition-[width] duration-sedang ease-standar"
                                style={{ width: `${persen}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </section>

              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Pesanan terbaru</h2>
                {metrics.recentOrders.length === 0 ? (
                  <EmptyState
                    icon="receipt"
                    title="Belum ada pesanan"
                    description="Pesanan yang baru masuk akan terlihat di sini."
                    className="mt-3"
                  />
                ) : (
                  <ul className="mt-3 divide-y divide-garis">
                    {metrics.recentOrders.map((order) => (
                      <li key={order.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-base font-semibold text-tinta">{order.invoiceNumber}</p>
                          <p className="text-base text-tinta-lembut">
                            {ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
                          </p>
                        </div>
                        <p className="text-base text-tinta">
                          {order.shopName} · {order.buyerName}
                        </p>
                        <p className="text-base text-tinta-lembut">
                          {formatRupiah(order.totalAmount)} · {tanggal(order.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
