"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NotificationItem } from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast";
import { cardClass, errorBoxClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { refreshBadges } from "@/lib/badges";
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

const TEMPLATE_ICON: Record<string, "chat" | "card" | "package" | "truck" | "shield" | "wallet"> = {
  OTP: "chat",
  WELCOME: "chat",
  ORDER: "package",
  PAYMENT: "card",
  SHIPPING: "truck",
  DISPUTE: "shield",
  WITHDRAWAL: "wallet",
};

function waktu(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function hariIni(value: string): string {
  const tanggal = new Date(value);
  const sekarang = new Date();
  const samaHari =
    tanggal.getFullYear() === sekarang.getFullYear() &&
    tanggal.getMonth() === sekarang.getMonth() &&
    tanggal.getDate() === sekarang.getDate();
  return samaHari ? "Hari ini" : waktu(value);
}

export default function InboxPage() {
  const { status, request } = useAuth();
  const { notify } = useToast();
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
      refreshBadges();
      notify("Pesan ditandai sudah dibaca.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesan belum bisa ditandai.");
    }
  }

  const belumDibaca = items.filter((item) => !item.isRead).length;

  return (
    <main className="min-h-screen bg-krem pb-24 md:pb-0">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Pesan dari Bakul</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Inbox</h1>
            {belumDibaca > 0 ? (
              <p className="mt-1 text-base text-tinta-lembut">
                {belumDibaca} pesan belum dibaca
              </p>
            ) : null}
          </div>
          <Link
            href="/akun"
            className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
          >
            <Icon name="arrowLeft" size={18} />
            Kembali ke akun
          </Link>
        </div>

        {status === "memuat" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Memeriksa sesi…</p>
          </div>
        ) : null}

        {status === "tamu" ? (
          <EmptyState
            icon="user"
            title="Masuk dulu, ya"
            description="Inbox berisi kode masuk dan kabar pesanan."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {status === "masuk" ? (
          <div className="mt-6 space-y-3">
            {error ? (
              <div className={errorBoxClass} role="alert">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : null}

            {!loading && items.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="Belum ada pesan untukmu"
                description="Kode masuk dan kabar pesanan akan muncul di sini."
                action={{ label: "Cari barang", href: "/cari" }}
              />
            ) : null}

            {items.map((item) => {
              const message =
                typeof item.payload.message === "string" ? item.payload.message : null;
              const code = typeof item.payload.code === "string" ? item.payload.code : null;
              const icon = TEMPLATE_ICON[item.template] ?? "chat";

              return (
                <article
                  key={item.id}
                  className={`rounded-kartu border p-4 transition duration-sedang ease-standar ${
                    item.isRead
                      ? "border-garis bg-putih"
                      : "border-teal bg-mint-muda"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pil ${
                          item.isRead
                            ? "bg-abu-kartu text-tinta-lembut"
                            : "bg-teal-aksi text-putih"
                        }`}
                      >
                        <Icon name={icon} size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-tinta">Bakul</p>
                        <p className="text-base text-tinta-lembut">
                          {TEMPLATE_LABEL[item.template] ?? item.template}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base text-tinta-lembut">{hariIni(item.createdAt)}</p>
                      {!item.isRead ? (
                        <>
                          <span
                            className="mt-1 inline-block h-2 w-2 rounded-pil bg-teal-aksi"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Belum dibaca</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {message ? <p className="mt-3 text-base text-tinta">{message}</p> : null}

                  {code ? (
                    <p className="mt-3 rounded-kartu border border-garis bg-putih p-3 text-base text-tinta">
                      Kode: <strong className="text-xl tracking-wide">{code}</strong>
                    </p>
                  ) : null}

                  {!item.isRead ? (
                    <button
                      type="button"
                      className={`${secondaryButtonClass} mt-3`}
                      onClick={() => void tandaiDibaca(item)}
                    >
                      <Icon name="check" size={18} />
                      Tandai sudah dibaca
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
      <BottomNav />
    </main>
  );
}
