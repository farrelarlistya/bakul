"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  DISPUTE_SOLUTION_LABEL,
  DISPUTE_STATUS_LABEL,
  ADMIN_DECISIONS,
  formatRupiah,
  type AdminDecision,
  type AdminDisputeItem,
  type OrderInvoiceView,
} from "@bakul/shared";
import { OrderStatusBadge } from "@/components/order-status";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { Icon } from "@/components/icon";
import { Skeleton } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
import {
  cardClass,
  errorBoxClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

const DECISION_LABEL: Record<string, string> = {
  RELEASE: "Dana ke penjual",
  REFUND_FULL: "Uang kembali semua",
  REFUND_PARTIAL: "Uang kembali sebagian",
  RETURN: "Barang dikembalikan",
};

const DECISION_TONE: Record<string, string> = {
  RELEASE: "bg-mint-muda text-teal-aksi",
  REFUND_FULL: "bg-bahaya-muda text-bahaya",
  REFUND_PARTIAL: "bg-krem text-perhatian-tua",
  RETURN: "bg-krem text-perhatian-tua",
};

function waktu(value: string | null): string {
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

export default function AdminDisputesPage() {
  const { status, user, request } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState<AdminDisputeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<OrderInvoiceView | null>(null);
  const [decision, setDecision] = useState<AdminDecision>("RELEASE");
  const [refundAmount, setRefundAmount] = useState("");
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [konfirmasiSimpan, setKonfirmasiSimpan] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const list = await request<AdminDisputeItem[]>("/api/v1/admin/disputes");
      const sorted = [...list].sort((a, b) => {
        const done = (value: string) =>
          ["RESOLVED_BUYER", "RESOLVED_SELLER", "CLOSED", "CANCELLED_BY_BUYER"].includes(value);
        return Number(done(a.status)) - Number(done(b.status));
      });
      setItems(sorted);
      setSelectedId((current) => current ?? sorted[0]?.id ?? null);
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Komplain belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  const loadDetail = useCallback(
    async (id: string) => {
      try {
        setInvoice(await request<OrderInvoiceView>(`/api/v1/admin/disputes/${id}`));
        setError(null);
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : "Detail komplain belum bisa dimuat.");
      }
    },
    [request],
  );

  useEffect(() => {
    if (status === "masuk" && user?.role === "ADMIN") {
      void loadList();
    }
  }, [status, user?.role, loadList]);

  useEffect(() => {
    if (selectedId) {
      setInvoice(null);
      void loadDetail(selectedId);
    }
  }, [selectedId, loadDetail]);

  async function putuskan(): Promise<void> {
    setKonfirmasiSimpan(false);
    if (!selectedId) {
      return;
    }
    if (note.trim().length < 3) {
      setNoteError("Tulis alasan keputusan minimal 3 huruf.");
      return;
    }
    const amount = Number(refundAmount.replace(/\D/g, ""));
    if (decision === "REFUND_PARTIAL" && !amount) {
      setNoteError("Isi jumlah uang yang dikembalikan.");
      return;
    }

    setBusy(true);
    setError(null);
    setNoteError(null);
    try {
      await request(`/api/v1/admin/disputes/${selectedId}/decide`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          note,
          ...(decision === "REFUND_PARTIAL" ? { refundAmount: amount } : {}),
        }),
      });
      setMessage("Keputusan disimpan.");
      notify("Keputusan disimpan.");
      await loadList();
      await loadDetail(selectedId);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Keputusan belum bisa disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function tandaiKembali(): Promise<void> {
    if (!selectedId) {
      return;
    }
    setBusy(true);
    try {
      await request(`/api/v1/admin/disputes/${selectedId}/returned`, { method: "POST" });
      setMessage("Barang ditandai sudah kembali. Uang dikembalikan.");
      notify("Barang ditandai sudah kembali. Uang dikembalikan.");
      await loadDetail(selectedId);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Belum bisa ditandai kembali.");
    } finally {
      setBusy(false);
    }
  }

  async function balas(): Promise<void> {
    if (!invoice || !reply.trim()) {
      return;
    }
    setBusy(true);
    try {
      await request(`/api/v1/orders/${invoice.id}/dispute/messages`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      });
      setReply("");
      setMessage("Balasan admin terkirim.");
      notify("Balasan admin terkirim.");
      await loadDetail(selectedId ?? "");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Balasan belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Tim Bakul</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Pusat resolusi</h1>
            <p className="mt-2 text-base text-tinta-lembut">
              Baca bukti dan riwayat, lalu putuskan dengan adil.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className={secondaryButtonClass}>
              Dashboard
            </Link>
            <Link href="/admin/pencairan" className={secondaryButtonClass}>
              Pencairan
            </Link>
          </div>
        </div>

        {status === "tamu" || (status === "masuk" && user?.role !== "ADMIN") ? (
          <EmptyState
            icon="lock"
            title="Halaman ini hanya untuk admin"
            description="Masuk dengan akun admin untuk membuka pusat resolusi."
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

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-tinta">Daftar komplain</h2>
              <span className="inline-flex min-h-8 items-center rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta-lembut">
                {items.length} kasus
              </span>
            </div>
            {loading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-20 w-full rounded-kartu" />
                <Skeleton className="h-20 w-full rounded-kartu" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon="shield"
                title="Belum ada komplain"
                description="Semua pesanan berjalan lancar. Bagus."
                className="mt-3"
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {items.map((item) => {
                  const aktif = selectedId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        aria-pressed={aktif}
                        className={`w-full rounded-kartu border p-3 text-left transition duration-cepat ease-standar active:scale-[0.99] ${
                          aktif
                            ? "border-teal-aksi bg-mint-muda"
                            : "border-garis bg-putih hover:border-garis-kuat hover:bg-abu-kartu/40"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-base font-semibold text-tinta">
                            {item.invoiceNumber}
                          </span>
                          <span className="text-base text-tinta-lembut">
                            {formatRupiah(item.totalAmount)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-base text-tinta-lembut">
                          {item.shopName} · {item.buyerName}
                        </span>
                        <span className="mt-1 block text-base font-semibold text-tinta">
                          {DISPUTE_STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={cardClass}>
            {!invoice ? (
              loading ? (
                <Skeleton className="h-72 w-full rounded-kartu" />
              ) : (
                <EmptyState
                  icon="chat"
                  title="Pilih komplain dari daftar"
                  description="Kasus yang dipilih akan tampil di sini lengkap dengan buktinya."
                  className="border-dashed"
                />
              )
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-base text-tinta-lembut">{invoice.invoiceNumber}</p>
                    <h2 className="font-display text-2xl font-bold text-tinta">{invoice.shop.name}</h2>
                    <p className="text-base text-tinta-lembut">
                      Pembeli {invoice.buyerName} ·{" "}
                      {invoice.dispute ? waktu(invoice.dispute.createdAt) : ""}
                    </p>
                  </div>
                  <OrderStatusBadge status={invoice.orderStatus} />
                </div>

                <div className="mt-3 rounded-kartu border border-garis-kuat bg-krem p-3">
                  <p className="text-base text-tinta">{invoice.dispute?.reason}</p>
                  <p className="mt-1 text-base text-tinta-lembut">
                    Diminta:{" "}
                    {DISPUTE_SOLUTION_LABEL[invoice.dispute?.requestedSolution ?? ""] ??
                      invoice.dispute?.requestedSolution}
                  </p>
                  <p className="mt-1 text-base text-tinta-lembut">
                    Nilai pesanan {formatRupiah(invoice.totalAmount)}
                  </p>
                </div>

                {invoice.dispute?.evidenceUrls.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {invoice.dispute.evidenceUrls.map((url) => (
                      <li key={url} className="h-20 w-20 overflow-hidden rounded-tombol border border-garis">
                        {url.endsWith(".webp") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="Bukti" width={80} height={80} className="h-full w-full object-cover" />
                        ) : (
                          <video src={url} className="h-full w-full object-cover" controls />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <h3 className="mt-4 text-base font-semibold text-tinta">Ruang diskusi</h3>
                {invoice.dispute?.messages.length ? (
                  <ul className="mt-2 space-y-2">
                    {invoice.dispute.messages.map((item) => (
                      <li key={item.id} className="rounded-kartu border border-garis bg-abu-kartu p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-base font-semibold text-tinta">{item.senderName}</p>
                          <p className="text-base text-tinta-lembut">{waktu(item.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-base text-tinta">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-base text-tinta-lembut">Belum ada balasan.</p>
                )}

                <div className="mt-4">
                  <Field label="Balas sebagai admin" htmlFor="admin-reply">
                    {(props) => (
                      <textarea
                        {...props}
                        className={`${inputClass} min-h-20 py-3`}
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        maxLength={2000}
                      />
                    )}
                  </Field>
                </div>
                <button
                  type="button"
                  className={`${secondaryButtonClass} mt-2`}
                  disabled={busy || !reply.trim()}
                  onClick={() => void balas()}
                >
                  Kirim balasan
                </button>

                {invoice.orderStatus === "RETURNING" ? (
                  <button
                    type="button"
                    className={`${primaryButtonClass} mt-4 w-full`}
                    disabled={busy}
                    onClick={() => void tandaiKembali()}
                  >
                    Barang sudah kembali — kembalikan uang
                  </button>
                ) : null}

                <h3 className="mt-5 text-base font-semibold text-tinta">Keputusan</h3>
                <div
                  role="radiogroup"
                  aria-label="Keputusan dana"
                  className="mt-2 space-y-2"
                >
                  {ADMIN_DECISIONS.map((item) => {
                    const dipilih = decision === item;
                    return (
                      <label
                        key={item}
                        className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-kartu border p-3 transition duration-cepat ease-standar ${
                          dipilih
                            ? "border-teal-aksi bg-mint-muda"
                            : "border-garis bg-putih hover:border-garis-kuat hover:bg-abu-kartu/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="decision"
                          checked={dipilih}
                          onChange={() => setDecision(item)}
                          className="h-6 w-6 shrink-0 accent-teal-aksi"
                        />
                        <span className="min-w-0 flex-1 text-base font-semibold text-tinta">
                          {DECISION_LABEL[item]}
                        </span>
                        <span
                          className={`inline-flex min-h-8 shrink-0 items-center rounded-pil px-3 text-base font-semibold ${
                            DECISION_TONE[item]
                          }`}
                        >
                          {dipilih ? (
                            <Icon name="check" size={16} />
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {decision === "REFUND_PARTIAL" ? (
                  <div className="mt-3">
                    <Field label="Jumlah uang kembali" htmlFor="refund-amount">
                      {(props) => (
                        <input
                          {...props}
                          inputMode="numeric"
                          className={inputClass}
                          value={refundAmount}
                          onChange={(event) =>
                            setRefundAmount(event.target.value.replace(/\D/g, ""))
                          }
                        />
                      )}
                    </Field>
                  </div>
                ) : null}

                <div className="mt-3">
                  <Field
                    label="Alasan keputusan"
                    htmlFor="decision-note"
                    error={noteError}
                    hint="Alasan ini dilihat pembeli dan penjual."
                  >
                    {(props) => (
                      <textarea
                        {...props}
                        className={`${inputClass} min-h-20 py-3`}
                        value={note}
                        onChange={(event) => {
                          setNote(event.target.value);
                          if (noteError) {
                            setNoteError(null);
                          }
                        }}
                        maxLength={2000}
                      />
                    )}
                  </Field>
                </div>

                <div className="mt-3 rounded-kartu border border-garis-kuat bg-abu-kartu p-3">
                  <p className="text-base font-semibold text-tinta">Dampak keputusan</p>
                  <p className="mt-1 text-base text-tinta-lembut">
                    {decision === "RELEASE"
                      ? `Dana ${formatRupiah(invoice.totalAmount)} diteruskan ke ${invoice.shop.name}.`
                      : decision === "REFUND_FULL"
                        ? `Dana ${formatRupiah(invoice.totalAmount)} dikembalikan penuh ke ${invoice.buyerName}.`
                        : decision === "REFUND_PARTIAL"
                          ? `Sebagian dana dikembalikan ke ${invoice.buyerName}, sisanya ke ${invoice.shop.name}.`
                          : `Barang dikembalikan ke ${invoice.shop.name}, dana ditahan sampai barang diterima.`}
                  </p>
                </div>

                <button
                  type="button"
                  className={`${primaryButtonClass} mt-4 w-full`}
                  disabled={busy}
                  aria-busy={busy}
                  onClick={() => setKonfirmasiSimpan(true)}
                >
                  {busy ? "Menyimpan…" : "Simpan keputusan"}
                </button>
              </>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={konfirmasiSimpan}
        title="Simpan keputusan ini?"
        description="Keputusan dana akan langsung dijalankan dan tidak bisa dibatalkan."
        confirmLabel="Ya, simpan"
        cancelLabel="Cek lagi"
        onConfirm={() => void putuskan()}
        onCancel={() => setKonfirmasiSimpan(false)}
      />
    </main>
  );
}
