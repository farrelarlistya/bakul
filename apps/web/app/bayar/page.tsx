"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PAYMENT_METHODS,
  calculateTotals,
  formatRupiah,
  sumOrderTotals,
  type Address,
  type CheckoutQuote,
  type CheckoutResult,
  type PaymentMethodValue,
} from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { CatalogHeader } from "@/components/catalog-header";
import { SiteFooter } from "@/components/site-footer";
import {
  cardClass,
  errorBoxClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

type Choice = { courier: string; service: string };

export default function BayarPage() {
  const router = useRouter();
  const { status, request } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [method, setMethod] = useState<PaymentMethodValue>("VA_BCA");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `checkout-${Date.now()}`,
  );

  useEffect(() => {
    if (status !== "masuk") {
      return;
    }

    void request<Address[]>("/api/v1/me/addresses")
      .then((items) => {
        setAddresses(items);
        setAddressId(items.find((item) => item.isDefault)?.id ?? items[0]?.id ?? "");
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Alamat belum bisa dimuat.");
      });
  }, [status, request]);

  const loadQuote = useCallback(
    async (selectedAddressId: string) => {
      if (!selectedAddressId) {
        setQuote(null);
        return;
      }

      setQuoteLoading(true);
      try {
        const result = await request<CheckoutQuote>("/api/v1/checkout/quote", {
          method: "POST",
          body: JSON.stringify({ addressId: selectedAddressId }),
        });
        setQuote(result);
        setChoices((current) => {
          const next = { ...current };
          for (const shop of result.shops) {
            if (!next[shop.shopId] && shop.rates[0]) {
              next[shop.shopId] = {
                courier: shop.rates[0].courier,
                service: shop.rates[0].service,
              };
            }
          }
          return next;
        });
        setError(null);
      } catch (caught: unknown) {
        setQuote(null);
        setError(caught instanceof Error ? caught.message : "Rincian biaya belum bisa dimuat.");
      } finally {
        setQuoteLoading(false);
      }
    },
    [request],
  );

  useEffect(() => {
    if (addressId) {
      void loadQuote(addressId);
    }
  }, [addressId, loadQuote]);

  const totals = useMemo(() => {
    if (!quote) {
      return sumOrderTotals([]);
    }

    return sumOrderTotals(
      quote.shops.map((shop) => {
        const choice = choices[shop.shopId];
        const rate = shop.rates.find(
          (item) => item.courier === choice?.courier && item.service === choice?.service,
        );
        return {
          subtotalItems: shop.subtotal,
          shippingCost: rate?.cost ?? 0,
        };
      }),
    );
  }, [quote, choices]);

  async function bayar(): Promise<void> {
    if (!quote || !addressId) {
      return;
    }

    const shipping = quote.shops.map((shop) => {
      const choice = choices[shop.shopId];
      return {
        shopId: shop.shopId,
        courier: choice?.courier ?? "",
        service: choice?.service ?? "",
      };
    });

    if (shipping.some((item) => !item.courier || !item.service)) {
      setError("Pilih kurir untuk setiap toko dulu.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await request<CheckoutResult>("/api/v1/checkout", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({
          addressId,
          paymentMethod: method,
          shipping,
          notes: notes.trim() || undefined,
        }),
      });
      router.push(`/pembayaran/${result.paymentId}`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Tagihan belum bisa dibuat.");
      setBusy(false);
    }
  }

  const canPay = Boolean(
    quote &&
      quote.shops.length > 0 &&
      quote.shops.every((shop) => choices[shop.shopId]) &&
      quote.shops.every((shop) => shop.rates.length > 0),
  );

  return (
    <main className="min-h-screen bg-putih pb-24 md:pb-0">
      <CatalogHeader />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link href="/keranjang" className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi">
          ← Kembali ke keranjang
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-tinta">Bayar</h1>
        <p className="mt-1 text-base text-tinta-lembut">
          Satu pembayaran untuk semua toko. Uang ditahan aman sampai barang diterima.
        </p>

        {status === "tamu" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk membayar.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {status === "masuk" ? (
          <>
            {error ? (
              <div className={`${errorBoxClass} mt-4`} role="alert">
                {error}
              </div>
            ) : null}

            {addresses.length === 0 ? (
              <div className={`${cardClass} mt-6`}>
                <p className="text-lg font-semibold text-tinta">Alamat belum diisi.</p>
                <p className="mt-1 text-base text-tinta-lembut">
                  Tambahkan alamat pengiriman dulu supaya ongkir bisa dihitung.
                </p>
                <Link href="/akun" className={`${primaryButtonClass} mt-4 w-full`}>
                  Isi alamat
                </Link>
              </div>
            ) : null}

            {addresses.length > 0 ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                <div className="space-y-5">
                  <section className={cardClass}>
                    <h2 className="font-display text-2xl font-bold text-tinta">Alamat kirim</h2>
                    <div className="mt-3 space-y-2">
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex min-h-11 cursor-pointer gap-3 rounded-kartu border p-3 ${
                            addressId === address.id
                              ? "border-teal-aksi bg-mint-muda"
                              : "border-garis bg-putih"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            className="mt-1 h-5 w-5"
                            checked={addressId === address.id}
                            onChange={() => setAddressId(address.id)}
                          />
                          <span className="min-w-0">
                            <span className="block text-base font-semibold text-tinta">
                              {address.label} · {address.recipientName}
                            </span>
                            <span className="block text-base text-tinta-lembut">
                              {address.phone}
                            </span>
                            <span className="block text-base text-tinta">
                              {address.fullAddress}, {address.postalCode}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <Link href="/akun" className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi">
                      + Tambah atau ubah alamat
                    </Link>
                  </section>

                  {quoteLoading ? (
                    <p className="text-base text-tinta-lembut">Menghitung ongkir…</p>
                  ) : null}

                  {quote?.shops.map((shop) => {
                    const choice = choices[shop.shopId];
                    return (
                      <section key={shop.shopId} className={cardClass}>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis pb-3">
                          <h2 className="text-lg font-semibold text-tinta">{shop.shopName}</h2>
                          <p className="text-base text-tinta-lembut">
                            {shop.cityName} · {shop.weightGram} g
                          </p>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {shop.items.map((item) => (
                            <li key={item.id} className="flex gap-3">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-tombol bg-mint-muda">
                                {item.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    width={56}
                                    height={56}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-base font-semibold text-tinta">{item.productName}</p>
                                <p className="text-base text-tinta-lembut">
                                  {item.variantName} × {item.quantity}
                                </p>
                              </div>
                              <p className="text-base font-semibold text-tinta">
                                {formatRupiah(item.price * item.quantity)}
                              </p>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-4">
                          <label className="mb-2 block text-base font-semibold text-tinta" htmlFor={`courier-${shop.shopId}`}>
                            Pilih kurir
                          </label>
                          <select
                            id={`courier-${shop.shopId}`}
                            className={inputClass}
                            value={choice ? `${choice.courier}:${choice.service}` : ""}
                            onChange={(event) => {
                              const [courier, service] = event.target.value.split(":");
                              if (courier && service) {
                                setChoices((current) => ({
                                  ...current,
                                  [shop.shopId]: { courier, service },
                                }));
                              }
                            }}
                          >
                            <option value="">Pilih kurir</option>
                            {shop.rates.map((rate) => (
                              <option key={`${rate.courier}-${rate.service}`} value={`${rate.courier}:${rate.service}`}>
                                {rate.courierName} {rate.serviceName} · {formatRupiah(rate.cost)} · {rate.etd}
                              </option>
                            ))}
                          </select>
                          {shop.rates.length === 0 ? (
                            <p className="mt-2 text-base text-bahaya">
                              Toko ini belum punya kurir aktif. Hubungi penjual atau pilih barang lain.
                            </p>
                          ) : null}
                        </div>
                      </section>
                    );
                  })}

                  <section className={cardClass}>
                    <h2 className="font-display text-2xl font-bold text-tinta">Cara bayar</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {PAYMENT_METHODS.map((item) => (
                        <label
                          key={item.value}
                          className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-kartu border p-3 ${
                            method === item.value
                              ? "border-teal-aksi bg-mint-muda"
                              : "border-garis bg-putih"
                          }`}
                        >
                          <input
                            type="radio"
                            name="method"
                            value={item.value}
                            checked={method === item.value}
                            onChange={() => setMethod(item.value)}
                            className="h-5 w-5"
                          />
                          <span className="text-base font-semibold text-tinta">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className={cardClass}>
                    <label className="block text-base font-semibold text-tinta" htmlFor="notes">
                      Catatan untuk penjual (opsional)
                    </label>
                    <textarea
                      id="notes"
                      className={`${inputClass} mt-2 min-h-24 py-3`}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Contoh: tolong dibungkus bubble wrap"
                    />
                  </section>
                </div>

                <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
                  <section className={cardClass}>
                    <h2 className="font-display text-2xl font-bold text-tinta">Rincian</h2>
                    <dl className="mt-3 space-y-2 text-base">
                      <div className="flex justify-between gap-3">
                        <dt className="text-tinta-lembut">Barang</dt>
                        <dd className="font-semibold text-tinta">{formatRupiah(totals.subtotalItems)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-tinta-lembut">Ongkir</dt>
                        <dd className="font-semibold text-tinta">{formatRupiah(totals.shippingCost)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-tinta-lembut">Biaya layanan</dt>
                        <dd className="font-semibold text-tinta">{formatRupiah(totals.serviceFee)}</dd>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-garis pt-3">
                        <dt className="text-lg font-semibold text-tinta">Total bayar</dt>
                        <dd className="text-xl font-bold text-tinta">{formatRupiah(totals.totalAmount)}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-base text-tinta-lembut">
                      Uang ditahan aman. Penjual baru menerima dana setelah barang kamu terima.
                    </p>
                    <button
                      type="button"
                      className={`${primaryButtonClass} mt-4 w-full`}
                      disabled={!canPay || busy || quoteLoading}
                      onClick={() => void bayar()}
                    >
                      {busy ? "Membuat tagihan…" : "Bayar sekarang"}
                    </button>
                    <Link href="/keranjang" className={`${secondaryButtonClass} mt-2 w-full`}>
                      Ubah keranjang
                    </Link>
                  </section>
                </aside>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
