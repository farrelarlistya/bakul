"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  WITHDRAWAL_STATUS_LABEL,
  formatRupiah,
  type WithdrawalView,
} from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
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

type DialogState = {
  item: WithdrawalView;
  action: "approve" | "reject";
} | null;

export default function AdminWithdrawalsPage() {
  const { status, user, request, download } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState<WithdrawalView[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const load = useCallback(async () => {
    try {
      setItems(await request<WithdrawalView[]>("/api/v1/admin/withdrawals"));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pencairan belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (status === "masuk" && user?.role === "ADMIN") {
      void load();
    }
  }, [status, user?.role, load]);

  async function proses(item: WithdrawalView, action: "approve" | "reject", note: string) {
    setDialog(null);
    setBusy(item.id);
    setError(null);
    try {
      await request(`/api/v1/admin/withdrawals/${item.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
      const pesan =
        action === "approve"
          ? "Pencairan disetujui dan bukti transfer simulasi dibuat."
          : "Pencairan ditolak. Saldo kembali ke dompet toko.";
      setMessage(pesan);
      notify(pesan);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pencairan belum bisa diproses.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
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
          <EmptyState
            icon="lock"
            title="Halaman ini hanya untuk admin"
            description="Masuk dengan akun admin untuk memproses pencairan."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
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

        {loading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-32 w-full rounded-kartu" />
            <Skeleton className="h-32 w-full rounded-kartu" />
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {items.length === 0 && !loading ? (
            <EmptyState
              icon="bank"
              title="Belum ada pengajuan pencairan"
              description="Pengajuan tarik saldo dari toko akan muncul di sini."
            />
          ) : null}

          {items.map((item) => (
            <article key={item.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-2xl font-bold text-tinta">
                    {formatRupiah(item.amount)}
                  </p>
                  <p className="text-base font-semibold text-tinta">{item.shopName ?? "Toko"}</p>
                  <p className="text-base text-tinta-lembut">
                    {item.bankName} · {item.bankAccountNumber} · {item.bankAccountHolder}
                  </p>
                  <p className="text-base text-tinta-lembut">
                    Diajukan {tanggal(item.requestedAt)}
                  </p>
                </div>
                <span className="inline-flex min-h-8 shrink-0 items-center rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta">
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
                      onClick={() => setDialog({ item, action: "approve" })}
                    >
                      <Icon name="check" size={18} />
                      Setujui & cairkan
                    </button>
                    <button
                      type="button"
                      className={dangerButtonClass}
                      disabled={busy === item.id}
                      onClick={() => setDialog({ item, action: "reject" })}
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
                    <Icon name="download" size={18} />
                    Unduh bukti transfer
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      <PromptDialog
        open={dialog !== null}
        title={
          dialog?.action === "approve"
            ? "Setujui pencairan ini?"
            : "Tolak pencairan ini?"
        }
        description={
          dialog?.action === "approve"
            ? "Saldo toko dipindahkan dan bukti transfer simulasi dibuat."
            : "Saldo kembali ke dompet toko dan pengaju diberi tahu."
        }
        label={dialog?.action === "approve" ? "Catatan transfer" : "Alasan menolak"}
        defaultValue={dialog?.action === "approve" ? "Transfer simulasi berhasil." : ""}
        placeholder={
          dialog?.action === "approve" ? "Transfer simulasi berhasil." : "Rekening belum lengkap."
        }
        confirmLabel={dialog?.action === "approve" ? "Ya, cairkan" : "Ya, tolak"}
        required={dialog?.action === "reject"}
        onConfirm={(note) => {
          if (dialog) {
            void proses(dialog.item, dialog.action, note);
          }
        }}
        onCancel={() => setDialog(null)}
      />
    </main>
  );
}
