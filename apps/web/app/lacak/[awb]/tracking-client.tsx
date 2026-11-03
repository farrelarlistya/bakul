"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TrackingEvent } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { SiteFooter } from "@/components/site-footer";
import { cardClass, errorBoxClass, primaryButtonClass } from "@/components/ui";

type Tracking = {
  awb: string;
  courierName: string;
  serviceType: string;
  status: string;
  invoiceNumber: string;
  shopName: string;
  originCity: string;
  destinationCity: string;
  recipientName: string;
  events: TrackingEvent[];
};

function waktu(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TrackingClient({ awb }: { awb: string }) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(`/api/v1/tracking/${encodeURIComponent(awb)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const message =
            body && typeof body === "object" && "error" in body
              ? String((body as { error?: { message?: string } }).error?.message)
              : "Resi belum bisa dilacak.";
          throw new Error(message);
        }
        return (await response.json()) as Tracking;
      })
      .then((result) => {
        setTracking(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(caught instanceof Error ? caught.message : "Resi belum bisa dilacak.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [awb]);

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <CatalogHeader />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/pesanan" className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi">
          ← Kembali ke pesanan
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-tinta">Lacak paket</h1>

        {loading ? <p className="mt-4 text-base text-tinta-lembut">Memuat perjalanan paket…</p> : null}
        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}

        {tracking ? (
          <div className="mt-5 space-y-4">
            <section className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base text-tinta-lembut">
                    {tracking.courierName} · {tracking.serviceType}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-wide text-tinta">{tracking.awb}</p>
                  <p className="mt-1 text-base text-tinta-lembut">
                    {tracking.shopName} → {tracking.destinationCity}
                  </p>
                </div>
                <span className="rounded-pil bg-mint px-3 py-1 text-base font-semibold text-teal-aksi">
                  {tracking.status === "DELIVERED" ? "Sudah sampai" : "Dalam perjalanan"}
                </span>
              </div>
              <p className="mt-2 text-base text-tinta-lembut">
                Penerima: {tracking.recipientName} · Pesanan {tracking.invoiceNumber}
              </p>
              <p className="mt-3 rounded-kartu bg-krem p-3 text-base text-tinta">
                Pengiriman ini simulasi. Tidak ada paket nyata yang bergerak.
              </p>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Perjalanan paket</h2>
              {tracking.events.length === 0 ? (
                <p className="mt-2 text-base text-tinta-lembut">
                  Resi sudah dibuat. Paket belum diambil kurir.
                </p>
              ) : (
                <ol className="mt-4 space-y-0">
                  {tracking.events.map((event, index) => (
                    <li key={`${event.status}-${event.at}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-1 inline-block h-3 w-3 rounded-pil ${
                            index === tracking.events.length - 1 ? "bg-teal-aksi" : "bg-mint"
                          }`}
                        />
                        {index < tracking.events.length - 1 ? (
                          <span className="h-16 w-0.5 bg-garis" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 pb-4">
                        <p className="text-base font-semibold text-tinta">{event.label}</p>
                        <p className="text-base text-tinta">{event.note}</p>
                        <p className="text-base text-tinta-lembut">
                          {event.location} · {waktu(event.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        ) : null}

        {error ? (
          <Link href="/cari" className={`${primaryButtonClass} mt-4`}>
            Kembali belanja
          </Link>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
