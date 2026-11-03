"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NotificationItem } from "@bakul/shared";
import { SiteHeader } from "@/components/site-header";
import { cardClass, errorBoxClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const TEMPLATE_LABEL: Record<string, string> = {
  OTP: "Kode masuk",
  WELCOME: "Selamat datang",
  ORDER: "Pesanan",
  PAYMENT: "Pembayaran",
  SHIPPING: "Pengiriman",
  DISPUTE: "Komplain",
  WITHDRAWAL: "Pencairan",
};

function waktu(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function InboxPage() {
  const { status, request } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "masuk") {
      return;
    }

    let alive = true;
    setLoading(true);

    void request<NotificationItem[]>("/api/v1/notifications")
      .then((notifications) => {
        if (alive) {
          setItems(notifications);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (alive) {
          setError(caught instanceof Error ? caught.message : "Inbox belum bisa dimuat.");
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [status, request]);

  async function tandaiDibaca(item: NotificationItem): Promise<void> {
    if (item.isRead) {
      return;
    }

    try {
      await request(`/api/v1/notifications/${item.id}/read`, { method: "PATCH" });
      setItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
      );
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesan belum bisa ditandai.");
    }
  }

  return (
    <main className="min-h-screen bg-krem">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Pesan dari Bakul</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Inbox</h1>
          </div>
          <Link href="/akun" className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi">
            Kembali ke akun
          </Link>
        </div>

        {status === "memuat" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Memeriksa sesi…</p>
          </div>
        ) : null}

        {status === "tamu" ? (
          <div className={`${cardClass} mt-6`}>
            <h2 className="font-display text-2xl font-bold text-tinta">Masuk dulu, ya</h2>
            <p className="mt-2 text-base text-tinta-lembut">
              Inbox berisi kode masuk dan kabar pesanan.
            </p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {status === "masuk" ? (
          <div className="mt-6 space-y-3">
            {error ? (
              <div className={errorBoxClass} role="alert">
                {error}
              </div>
            ) : null}

            {loading ? <p className="text-base text-tinta-lembut">Memuat pesan…</p> : null}

            {!loading && items.length === 0 ? (
              <div className={cardClass}>
                <p className="text-base text-tinta-lembut">Belum ada pesan untukmu.</p>
              </div>
            ) : null}

            {items.map((item) => {
              const message =
                typeof item.payload.message === "string" ? item.payload.message : null;
              const code = typeof item.payload.code === "string" ? item.payload.code : null;

              return (
                <article
                  key={item.id}
                  className={`rounded-kartu border p-4 ${
                    item.isRead ? "border-garis bg-putih" : "border-teal bg-mint-muda"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-pil bg-teal-aksi text-lg font-bold text-putih">
                        B
                      </span>
                      <div>
                        <p className="text-base font-semibold text-tinta">Bakul</p>
                        <p className="text-base text-tinta-lembut">
                          {TEMPLATE_LABEL[item.template] ?? item.template}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base text-tinta-lembut">{waktu(item.createdAt)}</p>
                      {!item.isRead ? (
                        <span className="mt-1 inline-block h-2 w-2 rounded-pil bg-teal-aksi" aria-label="Belum dibaca" />
                      ) : null}
                    </div>
                  </div>

                  {message ? <p className="mt-3 text-base text-tinta">{message}</p> : null}

                  {code ? (
                    <p className="mt-3 rounded-kartu bg-putih p-3 text-base text-tinta">
                      Kode: <strong className="text-xl">{code}</strong>
                    </p>
                  ) : null}

                  {!item.isRead ? (
                    <button
                      type="button"
                      className={`${secondaryButtonClass} mt-3`}
                      onClick={() => void tandaiDibaca(item)}
                    >
                      Tandai sudah dibaca
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
