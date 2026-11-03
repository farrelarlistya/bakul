"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ORDER_STATUS_LABEL,
  formatRupiah,
  type AdminMetrics,
} from "@bakul/shared";
import { SiteHeader } from "@/components/site-header";
import { cardClass, errorBoxClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "masuk" || user?.role !== "ADMIN") {
      return;
    }
    void request<AdminMetrics>("/api/v1/admin/metrics")
      .then((data) => {
        setMetrics(data);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Ringkasan belum bisa dimuat.");
      });
  }, [status, user?.role, request]);

  return (
    <main className="min-h-screen bg-krem pb-10">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
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
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Halaman ini hanya untuk admin.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4`}>
              Masuk sebagai admin
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}

        {metrics ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Nilai transaksi (GMV)", value: formatRupiah(metrics.gmv) },
                { label: "Uang ditahan aman", value: formatRupiah(metrics.escrowHeld) },
                { label: "Pendapatan platform", value: formatRupiah(metrics.revenue) },
                { label: "Pesanan selesai", value: `${metrics.completedOrders} dari ${metrics.orderCount}` },
                { label: "Toko aktif", value: String(metrics.activeShops) },
                { label: "Barang aktif", value: String(metrics.activeProducts) },
                { label: "Menunggu penjual", value: String(metrics.waitingSeller) },
                { label: "Perlu diputuskan", value: `${metrics.openDisputes} komplain · ${metrics.pendingWithdrawals} pencairan` },
              ].map((item) => (
                <div key={item.label} className={cardClass}>
                  <p className="text-base text-tinta-lembut">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-tinta">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Pesanan per status</h2>
                <ul className="mt-3 space-y-2">
                  {metrics.ordersByStatus
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((row) => (
                      <li key={row.status} className="flex items-center justify-between gap-3">
                        <span className="text-base text-tinta">
                          {ORDER_STATUS_LABEL[row.status] ?? row.status}
                        </span>
                        <span className="rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta">
                          {row.count}
                        </span>
                      </li>
                    ))}
                </ul>
              </section>

              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Pesanan terbaru</h2>
                {metrics.recentOrders.length === 0 ? (
                  <p className="mt-2 text-base text-tinta-lembut">Belum ada pesanan.</p>
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
