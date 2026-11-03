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
import { SiteHeader } from "@/components/site-header";
import {
  cardClass,
  errorBoxClass,
  inputClass,
  labelClass,
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
  const [items, setItems] = useState<AdminDisputeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<OrderInvoiceView | null>(null);
  const [decision, setDecision] = useState<AdminDecision>("RELEASE");
  const [refundAmount, setRefundAmount] = useState("");
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    if (!selectedId) {
      return;
    }
    if (note.trim().length < 3) {
      setError("Tulis alasan keputusan dulu.");
      return;
    }
    const amount = Number(refundAmount.replace(/\D/g, ""));
    if (decision === "REFUND_PARTIAL" && !amount) {
      setError("Isi jumlah uang yang dikembalikan.");
      return;
    }

    setBusy(true);
    setError(null);
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
      await loadDetail(selectedId ?? "");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Balasan belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
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

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <section className={cardClass}>
            <h2 className="font-display text-2xl font-bold text-tinta">Daftar komplain</h2>
            {items.length === 0 ? (
              <p className="mt-2 text-base text-tinta-lembut">Belum ada komplain.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-kartu border p-3 text-left ${
                        selectedId === item.id
                          ? "border-teal-aksi bg-mint-muda"
                          : "border-garis bg-putih"
                      }`}
                    >
                      <p className="text-base font-semibold text-tinta">{item.invoiceNumber}</p>
                      <p className="text-base text-tinta-lembut">
                        {item.shopName} · {item.buyerName}
                      </p>
                      <p className="text-base text-tinta-lembut">
                        {formatRupiah(item.totalAmount)} ·{" "}
                        {DISPUTE_STATUS_LABEL[item.status] ?? item.status}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={cardClass}>
            {!invoice ? (
              <p className="text-base text-tinta-lembut">Pilih komplain dari daftar.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-base text-tinta-lembut">{invoice.invoiceNumber}</p>
                    <h2 className="font-display text-2xl font-bold text-tinta">{invoice.shop.name}</h2>
                    <p className="text-base text-tinta-lembut">
                      Pembeli {invoice.buyerName} · {invoice.dispute ? waktu(invoice.dispute.createdAt) : ""}
                    </p>
                  </div>
                  <OrderStatusBadge status={invoice.orderStatus} />
                </div>

                <div className="mt-3 rounded-kartu bg-krem p-3">
                  <p className="text-base text-tinta">{invoice.dispute?.reason}</p>
                  <p className="mt-1 text-base text-tinta-lembut">
                    Diminta:{" "}
                    {DISPUTE_SOLUTION_LABEL[invoice.dispute?.requestedSolution ?? ""] ??
                      invoice.dispute?.requestedSolution}
                  </p>
                  <p className="text-base text-tinta-lembut">
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
                <ul className="mt-2 space-y-2">
                  {invoice.dispute?.messages.map((item) => (
                    <li key={item.id} className="rounded-kartu bg-abu-kartu p-3">
                      <p className="text-base font-semibold text-tinta">
                        {item.senderName} · {item.senderRole}
                      </p>
                      <p className="text-base text-tinta">{item.body}</p>
                      <p className="text-base text-tinta-lembut">{waktu(item.createdAt)}</p>
                    </li>
                  ))}
                </ul>

                <label className={`${labelClass} mt-3`} htmlFor="admin-reply">
                  Balas sebagai admin
                </label>
                <textarea
                  id="admin-reply"
                  className={`${inputClass} min-h-20 py-3`}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  maxLength={2000}
                />
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
                <div className="mt-2 space-y-2">
                  {ADMIN_DECISIONS.map((item) => (
                    <label
                      key={item}
                      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-kartu border p-3 ${
                        decision === item ? "border-teal-aksi bg-mint-muda" : "border-garis"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === item}
                        onChange={() => setDecision(item)}
                        className="h-5 w-5"
                      />
                      <span className="text-base font-semibold text-tinta">
                        {DECISION_LABEL[item]}
                      </span>
                    </label>
                  ))}
                </div>

                {decision === "REFUND_PARTIAL" ? (
                  <>
                    <label className={`${labelClass} mt-3`} htmlFor="refund-amount">
                      Jumlah uang kembali
                    </label>
                    <input
                      id="refund-amount"
                      inputMode="numeric"
                      className={inputClass}
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value.replace(/\D/g, ""))}
                    />
                  </>
                ) : null}

                <label className={`${labelClass} mt-3`} htmlFor="decision-note">
                  Alasan keputusan
                </label>
                <textarea
                  id="decision-note"
                  className={`${inputClass} min-h-20 py-3`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                />
                <button
                  type="button"
                  className={`${primaryButtonClass} mt-3 w-full`}
                  disabled={busy}
                  onClick={() => void putuskan()}
                >
                  {busy ? "Menyimpan…" : "Simpan keputusan"}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
