"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  WITHDRAWAL_STATUS_LABEL,
  formatRupiah,
  type WithdrawalView,
} from "@bakul/shared";
import { SiteHeader } from "@/components/site-header";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminWithdrawalsPage() {
  const { status, user, request, download } = useAuth();
  const [items, setItems] = useState<WithdrawalView[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await request<WithdrawalView[]>("/api/v1/admin/withdrawals"));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pencairan belum bisa dimuat.");
    }
  }, [request]);

  useEffect(() => {
    if (status === "masuk" && user?.role === "ADMIN") {
      void load();
    }
  }, [status, user?.role, load]);

  async function proses(item: WithdrawalView, action: "approve" | "reject"): Promise<void> {
    const note = window.prompt(
      action === "approve" ? "Catatan transfer (opsional)" : "Alasan menolak?",
      action === "approve" ? "Transfer simulasi berhasil." : "Rekening belum lengkap.",
    );
    if (note === null) {
      return;
    }

    setBusy(item.id);
    setError(null);
    try {
      await request(`/api/v1/admin/withdrawals/${item.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
      setMessage(
        action === "approve"
          ? "Pencairan disetujui dan bukti transfer simulasi dibuat."
          : "Pencairan ditolak. Saldo kembali ke dompet toko.",
      );
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pencairan belum bisa diproses.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Tim Bakul</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Pencairan saldo</h1>
            <p className="mt-2 text-base text-tinta-lembut">
              Setujui atau tolak pengajuan tarik saldo toko.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className={secondaryButtonClass}>
              Dashboard
            </Link>
            <Link href="/admin/komplain" className={secondaryButtonClass}>
              Komplain
            </Link>
          </div>
        </div>

        {status === "tamu" || (status === "masuk" && user?.role !== "ADMIN") ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Halaman ini hanya untuk admin.</p>
          </div>
        ) : null}
        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">{message}</p>
        ) : null}

        <div className="mt-5 space-y-3">
          {items.length === 0 ? (
            <div className={cardClass}>
              <p className="text-base text-tinta-lembut">Belum ada pengajuan pencairan.</p>
            </div>
          ) : null}

          {items.map((item) => (
            <article key={item.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-tinta">{formatRupiah(item.amount)}</p>
                  <p className="text-base text-tinta">{item.shopName ?? "Toko"}</p>
                  <p className="text-base text-tinta-lembut">
                    {item.bankName} · {item.bankAccountNumber} · {item.bankAccountHolder}
                  </p>
                  <p className="text-base text-tinta-lembut">
                    Diajukan {tanggal(item.requestedAt)}
                  </p>
                </div>
                <span className="rounded-pil bg-abu-kartu px-3 py-1 text-base font-semibold text-tinta">
                  {WITHDRAWAL_STATUS_LABEL[item.status] ?? item.status}
                </span>
              </div>

              {item.note ? (
                <p className="mt-2 text-base text-tinta">Catatan: {item.note}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {item.status === "REQUESTED" ? (
                  <>
                    <button
                      type="button"
                      className={primaryButtonClass}
                      disabled={busy === item.id}
                      onClick={() => void proses(item, "approve")}
                    >
                      Setujui & cairkan
                    </button>
                    <button
                      type="button"
                      className={dangerButtonClass}
                      disabled={busy === item.id}
                      onClick={() => void proses(item, "reject")}
                    >
                      Tolak
                    </button>
                  </>
                ) : null}
                {item.status === "COMPLETED" ? (
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() =>
                      void download(
                        `/api/v1/withdrawals/${item.id}/proof`,
                        `bukti-transfer-${item.id.slice(0, 8)}.txt`,
                      )
                    }
                  >
                    Unduh bukti transfer
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
