"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MIN_WITHDRAWAL,
  WITHDRAWAL_STATUS_LABEL,
  formatRupiah,
  type WalletMutation,
  type WalletSummary,
  type WithdrawalView,
} from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
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

type ShopInfo = {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
};

function tanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function hari(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function SellerWalletPage() {
  const { status, user, request, download } = useAuth();
  const { notify } = useToast();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [mutations, setMutations] = useState<WalletMutation[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalView[]>([]);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, mutationItems, withdrawalItems, shop] = await Promise.all([
        request<WalletSummary>("/api/v1/wallet"),
        request<WalletMutation[]>("/api/v1/wallet/mutations"),
        request<WithdrawalView[]>("/api/v1/withdrawals"),
        request<ShopInfo>("/api/v1/seller/shop"),
      ]);
      setWallet(summary);
      setMutations(mutationItems);
      setWithdrawals(withdrawalItems);
      setBankName((current) => current || shop.bankName || "");
      setAccountNumber((current) => current || shop.bankAccountNumber || "");
      setHolder((current) => current || shop.bankAccountHolder || "");
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Dompet belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (status === "masuk" && user?.shop) {
      void load();
    }
  }, [status, user?.shop, load]);

  async function ajukan(): Promise<void> {
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || value < MIN_WITHDRAWAL) {
      setFormError(`Minimum tarik saldo ${formatRupiah(MIN_WITHDRAWAL)}.`);
      return;
    }
    if (wallet && value > wallet.balanceAvailable) {
      setFormError("Jumlah melebihi saldo yang siap dicairkan.");
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !holder.trim()) {
      setFormError("Lengkapi data rekening dulu.");
      return;
    }

    setBusy(true);
    setError(null);
    setFormError(null);
    try {
      await request("/api/v1/withdrawals", {
        method: "POST",
        headers: {
          "Idempotency-Key":
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `wd-${Date.now()}`,
        },
        body: JSON.stringify({
          amount: value,
          bankName,
          bankAccountNumber: accountNumber,
          bankAccountHolder: holder,
        }),
      });
      setAmount("");
      setMessage("Pengajuan tarik saldo dikirim. Admin akan memeriksa.");
      notify("Pengajuan tarik saldo dikirim. Admin akan memeriksa.");
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pengajuan belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  const mutasiPerHari = new Map<string, WalletMutation[]>();
  for (const item of mutations) {
    const key = hari(item.createdAt);
    const current = mutasiPerHari.get(key) ?? [];
    current.push(item);
    mutasiPerHari.set(key, current);
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Toko kamu</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Dompet toko</h1>
            <p className="mt-2 text-base text-tinta-lembut">
              Saldo masuk setelah pesanan selesai. Tidak ada uang nyata di Bakul.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/jualan/pesanan" className={secondaryButtonClass}>
              Pesanan
            </Link>
            <Link href="/jualan/barang" className={secondaryButtonClass}>
              Barang
            </Link>
          </div>
        </div>

        {status === "tamu" ? (
          <EmptyState
            icon="user"
            title="Masuk dulu untuk membuka dompet"
            description="Masuk dengan nomor HP, lalu saldo tokomu akan tampil di sini."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-5`} role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-5" role="status">
            <StatusBanner tone="sukses">{message}</StatusBanner>
          </div>
        ) : null}

        {loading && !wallet ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-40 w-full rounded-kartu" />
            <Skeleton className="h-64 w-full rounded-kartu" />
          </div>
        ) : null}

        {wallet ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <section className="rounded-kartu border border-teal bg-teal-aksi p-5 text-putih">
                <p className="flex items-center gap-1 text-base text-mint-muda">
                  <Icon name="wallet" size={18} />
                  Saldo siap ditarik
                </p>
                <p className="mt-1 font-display text-4xl font-bold">
                  {formatRupiah(wallet.balanceAvailable)}
                </p>
                {wallet.balanceWithheld > 0 ? (
                  <p className="mt-2 flex items-center gap-1 text-base text-mint-muda">
                    <Icon name="clock" size={16} />
                    Sedang diproses: {formatRupiah(wallet.balanceWithheld)}
                  </p>
                ) : null}
                <p className="mt-3 text-base text-mint-muda">
                  Minimum tarik {formatRupiah(MIN_WITHDRAWAL)}.
                </p>
              </section>

              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Tarik saldo</h2>

                <div className="mt-3">
                  <Field
                    label="Jumlah"
                    htmlFor="amount"
                    error={formError}
                    hint={`Minimal ${formatRupiah(MIN_WITHDRAWAL)}.`}
                  >
                    {(props) => (
                      <input
                        {...props}
                        inputMode="numeric"
                        className={inputClass}
                        value={amount}
                        onChange={(event) => {
                          setAmount(event.target.value.replace(/\D/g, ""));
                          if (formError) {
                            setFormError(null);
                          }
                        }}
                        placeholder="50000"
                      />
                    )}
                  </Field>
                  {amount ? (
                    <p className="mt-1 text-base text-tinta-lembut">
                      {formatRupiah(Number(amount))}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Bank" htmlFor="bank">
                    {(props) => (
                      <input
                        {...props}
                        className={inputClass}
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Nomor rekening" htmlFor="account">
                    {(props) => (
                      <input
                        {...props}
                        inputMode="numeric"
                        className={inputClass}
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
                      />
                    )}
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Nama pemilik rekening" htmlFor="holder">
                    {(props) => (
                      <input
                        {...props}
                        className={inputClass}
                        value={holder}
                        onChange={(event) => setHolder(event.target.value)}
                      />
                    )}
                  </Field>
                </div>
                <button
                  type="button"
                  className={`${primaryButtonClass} mt-4 w-full`}
                  disabled={busy || loading}
                  aria-busy={busy}
                  onClick={() => void ajukan()}
                >
                  {busy ? (
                    <>
                      <Icon name="refresh" size={18} className="animate-memuat" />
                      Mengirim…
                    </>
                  ) : (
                    "Ajukan tarik saldo"
                  )}
                </button>
              </section>

              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Riwayat pengajuan</h2>
                {withdrawals.length === 0 ? (
                  <EmptyState
                    icon="bank"
                    title="Belum ada pengajuan"
                    description="Pengajuan tarik saldo yang pernah kamu kirim akan muncul di sini."
                    className="mt-3"
                  />
                ) : (
                  <ul className="mt-3 space-y-2">
                    {withdrawals.map((item) => (
                      <li key={item.id} className="rounded-kartu border border-garis p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-base font-semibold text-tinta">
                            {formatRupiah(item.amount)}
                          </p>
                          <span className="inline-flex min-h-8 items-center rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta">
                            {WITHDRAWAL_STATUS_LABEL[item.status] ?? item.status}
                          </span>
                        </div>
                        <p className="text-base text-tinta-lembut">
                          {item.bankName} · {item.bankAccountNumber}
                        </p>
                        <p className="text-base text-tinta-lembut">{tanggal(item.requestedAt)}</p>
                        {item.note ? (
                          <p className="text-base text-tinta">Catatan: {item.note}</p>
                        ) : null}
                        {item.status === "COMPLETED" ? (
                          <button
                            type="button"
                            className={`${secondaryButtonClass} mt-2`}
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
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Riwayat saldo</h2>
              {mutations.length === 0 ? (
                <EmptyState
                  icon="chart"
                  title="Belum ada riwayat saldo"
                  description="Saldo bertambah setelah pesanan selesai."
                  className="mt-3"
                />
              ) : (
                <div className="mt-3 space-y-5">
                  {[...mutasiPerHari.entries()].map(([tanggalKey, rows]) => (
                    <div key={tanggalKey}>
                      <p className="text-base font-semibold text-tinta-lembut">{tanggalKey}</p>
                      <ul className="mt-2 divide-y divide-garis">
                        {rows.map((item) => (
                          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                            <p className="min-w-0 flex-1 text-base font-semibold text-tinta">
                              {item.description}
                            </p>
                            <p
                              className={`text-base font-semibold ${
                                item.signedAmount >= 0 ? "text-teal-aksi" : "text-bahaya"
                              }`}
                            >
                              {item.signedAmount >= 0 ? "+" : "−"}
                              {formatRupiah(Math.abs(item.signedAmount))}
                            </p>
                            <p className="w-full text-base text-tinta-lembut sm:w-auto">
                              {tanggal(item.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
