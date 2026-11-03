"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  DISPUTE_SOLUTIONS,
  DISPUTE_SOLUTION_LABEL,
  DISPUTE_STATUS_LABEL,
  type DisputeSolution,
  type OrderInvoiceView,
} from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { Icon } from "@/components/icon";
import { OrderStatusBadge } from "@/components/order-status";
import { SiteFooter } from "@/components/site-footer";
import { Skeleton } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
import {
  cardClass,
  errorBoxClass,
  fileInputClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Pembeli",
  SELLER: "Penjual",
  ADMIN: "Admin",
};

function waktu(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ComplaintClient({ invoiceId }: { invoiceId: string }) {
  const { status, request } = useAuth();
  const { notify } = useToast();
  const [order, setOrder] = useState<OrderInvoiceView | null>(null);
  const [reason, setReason] = useState("");
  const [solution, setSolution] = useState<DisputeSolution>("REFUND_FULL");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [konfirmasiBatal, setKonfirmasiBatal] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await request<OrderInvoiceView>(`/api/v1/orders/${invoiceId}`));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pesanan belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId, request]);

  useEffect(() => {
    if (status === "masuk") {
      void load();
    }
  }, [status, load]);

  async function unggah(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", file);
      const result = await request<{ url: string }>(
        `/api/v1/orders/${invoiceId}/dispute/evidence`,
        { method: "POST", body: form },
      );
      setEvidence((current) => [...current, result.url]);
      setMessage("Bukti terunggah.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Bukti belum bisa diunggah.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function kirimKomplain(): Promise<void> {
    if (reason.trim().length < 10) {
      setReasonError("Ceritakan masalahnya minimal 10 huruf.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await request(`/api/v1/orders/${invoiceId}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason, requestedSolution: solution, evidenceUrls: evidence }),
      });
      setMessage("Komplain terkirim. Uang ditahan selama masalah diperiksa.");
      notify("Komplain terkirim. Uang ditahan selama masalah diperiksa.");
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Komplain belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  async function kirimBalasan(): Promise<void> {
    if (!reply.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await request(`/api/v1/orders/${invoiceId}/dispute/messages`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      });
      setReply("");
      setMessage("Balasan terkirim.");
      notify("Balasan terkirim.");
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Balasan belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  async function eskalasi(): Promise<void> {
    setBusy(true);
    try {
      await request(`/api/v1/orders/${invoiceId}/dispute/escalate`, { method: "POST" });
      setMessage("Komplain diteruskan ke admin.");
      notify("Komplain diteruskan ke admin.");
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Belum bisa diteruskan ke admin.");
    } finally {
      setBusy(false);
    }
  }

  async function batalkan(): Promise<void> {
    setKonfirmasiBatal(false);
    setBusy(true);
    try {
      await request(`/api/v1/orders/${invoiceId}/dispute/cancel`, { method: "POST" });
      setMessage("Komplain dicabut.");
      notify("Komplain dicabut.");
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Komplain belum bisa dicabut.");
    } finally {
      setBusy(false);
    }
  }

  const dispute = order?.dispute;
  const finished = dispute
    ? ["RESOLVED_BUYER", "RESOLVED_SELLER", "CLOSED", "CANCELLED_BY_BUYER"].includes(dispute.status)
    : false;

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href={`/pesanan/${invoiceId}`}
          className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
        >
          <Icon name="arrowLeft" size={18} />
          Kembali ke pesanan
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-tinta">Pusat komplain</h1>
        <p className="mt-1 text-base text-tinta-lembut">
          Ceritakan masalahnya dengan tenang. Uang tetap ditahan sampai selesai.
        </p>

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-24 w-full rounded-kartu" />
            <Skeleton className="h-56 w-full rounded-kartu" />
          </div>
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

        {order ? (
          <div className="mt-5 space-y-4">
            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base text-tinta-lembut">{order.invoiceNumber}</p>
                  <p className="text-lg font-semibold text-tinta">{order.shop.name}</p>
                </div>
                <OrderStatusBadge status={order.orderStatus} />
              </div>
            </section>

            {!dispute ? (
              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Apa masalahnya?</h2>

                <div className="mt-4">
                  <Field
                    label="Ceritakan"
                    htmlFor="reason"
                    error={reasonError}
                    hint="Tulis yang terjadi, barang apa, dan seperti apa kondisinya."
                  >
                    {(props) => (
                      <textarea
                        {...props}
                        className={`${inputClass} min-h-28 py-3`}
                        value={reason}
                        placeholder="Contoh: barang datang penyok dan warna berbeda dari foto."
                        maxLength={2000}
                        onChange={(event) => {
                          setReason(event.target.value);
                          if (reasonError) {
                            setReasonError(null);
                          }
                        }}
                      />
                    )}
                  </Field>
                </div>

                <p className="mb-2 mt-5 text-base font-semibold text-tinta" id="solusi-label">
                  Minta solusi
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby="solusi-label"
                  className="space-y-2"
                >
                  {DISPUTE_SOLUTIONS.map((item) => {
                    const selected = solution === item;
                    return (
                      <label
                        key={item}
                        className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-kartu border p-3 transition duration-cepat ease-standar ${
                          selected
                            ? "border-teal-aksi bg-mint-muda"
                            : "border-garis bg-putih hover:border-garis-kuat hover:bg-abu-kartu/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="solution"
                          value={item}
                          checked={selected}
                          onChange={() => setSolution(item)}
                          className="h-6 w-6 shrink-0 accent-teal-aksi"
                        />
                        <span className="min-w-0 flex-1 text-base font-semibold text-tinta">
                          {DISPUTE_SOLUTION_LABEL[item]}
                        </span>
                        {selected ? (
                          <span className="shrink-0 text-teal-aksi">
                            <Icon name="check" size={20} />
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-base font-semibold text-tinta" htmlFor="evidence">
                    Bukti foto atau video (opsional)
                  </label>
                  <input
                    id="evidence"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    onChange={(event) => void unggah(event)}
                    disabled={busy}
                    className={fileInputClass}
                  />
                  {evidence.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {evidence.map((url) => (
                        <li key={url} className="h-20 w-20 overflow-hidden rounded-tombol border border-garis">
                          {url.endsWith(".webp") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="Bukti komplain" width={80} height={80} className="h-full w-full object-cover" />
                          ) : (
                            <video src={url} className="h-full w-full object-cover" controls />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={`${primaryButtonClass} mt-4 w-full`}
                  disabled={busy}
                  aria-busy={busy}
                  onClick={() => void kirimKomplain()}
                >
                  {busy ? (
                    <>
                      <Icon name="refresh" size={18} className="animate-memuat" />
                      Mengirim…
                    </>
                  ) : (
                    "Kirim komplain"
                  )}
                </button>
              </section>
            ) : (
              <>
                <section className={cardClass}>
                  <h2 className="font-display text-2xl font-bold text-tinta">Ringkasan komplain</h2>
                  <p className="mt-2 text-base text-tinta">{dispute.reason}</p>
                  <p className="mt-1 text-base text-tinta-lembut">
                    Diminta: {DISPUTE_SOLUTION_LABEL[dispute.requestedSolution] ?? dispute.requestedSolution}
                  </p>
                  <p className="mt-1 text-base text-tinta-lembut">
                    Status: {DISPUTE_STATUS_LABEL[dispute.status] ?? dispute.status}
                  </p>
                  {dispute.decisionNote ? (
                    <p className="mt-3 rounded-kartu bg-krem p-3 text-base text-tinta">
                      Keputusan: {dispute.decisionNote}
                    </p>
                  ) : null}
                  {dispute.evidenceUrls.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {dispute.evidenceUrls.map((url) => (
                        <li key={url} className="h-20 w-20 overflow-hidden rounded-tombol border border-garis">
                          {url.endsWith(".webp") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="Bukti komplain" width={80} height={80} className="h-full w-full object-cover" />
                          ) : (
                            <video src={url} className="h-full w-full object-cover" controls />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>

                <section className={cardClass}>
                  <h2 className="font-display text-2xl font-bold text-tinta">Ruang diskusi</h2>
                  {dispute.messages.length === 0 ? (
                    <EmptyState
                      icon="chat"
                      title="Belum ada balasan"
                      description="Tulis pesan pertamamu supaya penjual tahu masalahnya."
                      className="mt-3"
                    />
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {dispute.messages.map((item) => {
                        const dariPembeli = item.senderRole === "BUYER";
                        return (
                          <li
                            key={item.id}
                            className={`rounded-kartu border p-3 ${
                              dariPembeli
                                ? "border-teal bg-mint-muda"
                                : "border-garis bg-abu-kartu"
                            }`}
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-base font-semibold text-tinta">
                                {item.senderName} · {ROLE_LABEL[item.senderRole] ?? item.senderRole}
                              </p>
                              <p className="text-base text-tinta-lembut">{waktu(item.createdAt)}</p>
                            </div>
                            <p className="mt-1 text-base text-tinta">{item.body}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {!finished ? (
                    <>
                      <label className="mb-2 mt-4 block text-base font-semibold text-tinta" htmlFor="reply">
                        Balas
                      </label>
                      <textarea
                        id="reply"
                        className={`${inputClass} min-h-20 py-3`}
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        maxLength={2000}
                      />
                      <button
                        type="button"
                        className={`${primaryButtonClass} mt-2 w-full`}
                        disabled={busy || !reply.trim()}
                        aria-busy={busy}
                        onClick={() => void kirimBalasan()}
                      >
                        Kirim balasan
                      </button>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {dispute.status !== "ESCALATED_TO_ADMIN" ? (
                          <button
                            type="button"
                            className={secondaryButtonClass}
                            disabled={busy}
                            onClick={() => void eskalasi()}
                          >
                            Minta admin memutuskan
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          disabled={busy}
                          onClick={() => setKonfirmasiBatal(true)}
                        >
                          Cabut komplain
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 text-base text-tinta-lembut">
                      Komplain ini sudah selesai. Tidak ada balasan baru yang diperlukan.
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />

      <ConfirmDialog
        open={konfirmasiBatal}
        title="Cabut komplain?"
        description="Uang akan ditahan aman seperti biasa dan pesanan berjalan lagi."
        confirmLabel="Ya, cabut"
        cancelLabel="Batal"
        danger
        onConfirm={() => void batalkan()}
        onCancel={() => setKonfirmasiBatal(false)}
      />
    </main>
  );
}
