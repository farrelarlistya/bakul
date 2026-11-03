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

export default function SellerWalletPage() {
  const { status, user, request, download } = useAuth();
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
      setError(`Minimum tarik saldo ${formatRupiah(MIN_WITHDRAWAL)}.`);
      return;
    }
    if (wallet && value > wallet.balanceAvailable) {
      setError("Jumlah melebihi saldo yang siap dicairkan.");
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !holder.trim()) {
      setError("Lengkapi data rekening dulu.");
      return;
    }

    setBusy(true);
    setError(null);
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
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pengajuan belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">
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
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk membuka dompet.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className={`${errorBoxClass} mt-5`} role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <p className="mt-5 rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">{message}</p>
        ) : null}

        {wallet ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <section className={`${cardClass} bg-teal-aksi text-putih`}>
                <p className="text-base text-mint">Saldo siap ditarik</p>
                <p className="mt-1 font-display text-4xl font-bold">
                  {formatRupiah(wallet.balanceAvailable)}
                </p>
                {wallet.balanceWithheld > 0 ? (
                  <p className="mt-2 text-base text-mint">
                    Sedang diproses: {formatRupiah(wallet.balanceWithheld)}
                  </p>
                ) : null}
                <p className="mt-3 text-base text-mint">
                  Minimum tarik {formatRupiah(MIN_WITHDRAWAL)}.
                </p>
              </section>

              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Tarik saldo</h2>
                <label className={`${labelClass} mt-3`} htmlFor="amount">
                  Jumlah
                </label>
                <input
                  id="amount"
                  inputMode="numeric"
                  className={inputClass}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
                  placeholder="50000"
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="bank">
                      Bank
                    </label>
                    <input
                      id="bank"
                      className={inputClass}
                      value={bankName}
                      onChange={(event) => setBankName(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="account">
                      Nomor rekening
                    </label>
                    <input
                      id="account"
                      inputMode="numeric"
                      className={inputClass}
                      value={accountNumber}
                      onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
                <label className={`${labelClass} mt-3`} htmlFor="holder">
                  Nama pemilik rekening
                </label>
                <input
                  id="holder"
                  className={inputClass}
                  value={holder}
                  onChange={(event) => setHolder(event.target.value)}
                />
                <button
                  type="button"
                  className={`${primaryButtonClass} mt-4 w-full`}
                  disabled={busy || loading}
                  onClick={() => void ajukan()}
                >
                  {busy ? "Mengirim…" : "Ajukan tarik saldo"}
                </button>
              </section>

              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Riwayat pengajuan</h2>
                {withdrawals.length === 0 ? (
                  <p className="mt-2 text-base text-tinta-lembut">Belum ada pengajuan.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {withdrawals.map((item) => (
                      <li key={item.id} className="rounded-kartu border border-garis p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-base font-semibold text-tinta">
                            {formatRupiah(item.amount)}
                          </p>
                          <span className="rounded-pil bg-abu-kartu px-2 text-base text-tinta">
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
              <h2 className="font-display text-2xl font-bold text-tinta">Mutasi saldo</h2>
              {mutations.length === 0 ? (
                <p className="mt-2 text-base text-tinta-lembut">
                  Belum ada mutasi. Saldo bertambah setelah pesanan selesai.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-garis">
                  {mutations.map((item) => (
                    <li key={item.id} className="py-3">
                      <p className="text-base font-semibold text-tinta">{item.description}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`text-base font-semibold ${
                            item.signedAmount >= 0 ? "text-teal-aksi" : "text-bahaya"
                          }`}
                        >
                          {item.signedAmount >= 0 ? "+" : "−"}
                          {formatRupiah(Math.abs(item.signedAmount))}
                        </p>
                        <p className="text-base text-tinta-lembut">{tanggal(item.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
