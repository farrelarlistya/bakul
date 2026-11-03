"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { COURIERS, SHOP_STATUS_LABEL } from "@bakul/shared";
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

type Shop = {
  id: string;
  name: string;
  slug: string;
  cityName: string;
  status: string;
  description: string | null;
  logoUrl: string | null;
  productCount: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  supportedCouriers: string[];
};

export default function SellerShopPage() {
  const { status, user, request } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [couriers, setCouriers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "masuk" || !user?.shop) {
      setLoading(false);
      return;
    }

    void request<Shop>("/api/v1/seller/shop")
      .then((data) => {
        setShop(data);
        setName(data.name);
        setDescription(data.description ?? "");
        setBankName(data.bankName ?? "");
        setAccountNumber(data.bankAccountNumber ?? "");
        setHolder(data.bankAccountHolder ?? "");
        setCouriers(data.supportedCouriers);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Toko belum bisa dimuat.");
      })
      .finally(() => setLoading(false));
  }, [status, user?.shop, request]);

  function toggleCourier(code: string): void {
    setCouriers((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function unggahLogo(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setLogoBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", file);
      const updated = await request<Shop>("/api/v1/seller/shop/logo", {
        method: "POST",
        body: form,
      });
      setShop(updated);
      setMessage("Logo toko diperbarui.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Logo belum bisa diunggah.");
    } finally {
      setLogoBusy(false);
      event.target.value = "";
    }
  }

  async function simpan(): Promise<void> {    if (!name.trim()) {
      setError("Nama toko wajib diisi.");
      return;
    }
    if (couriers.length === 0) {
      setError("Pilih minimal satu kurir.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const updated = await request<Shop>("/api/v1/seller/shop", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          description,
          bankName: bankName || null,
          bankAccountNumber: accountNumber || null,
          bankAccountHolder: holder || null,
          supportedCouriers: couriers,
        }),
      });
      setShop(updated);
      setMessage("Pengaturan toko disimpan.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pengaturan belum bisa disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Toko kamu</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Pengaturan toko</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/jualan/pesanan" className={secondaryButtonClass}>
              Pesanan
            </Link>
            <Link href="/jualan/dompet" className={secondaryButtonClass}>
              Dompet
            </Link>
          </div>
        </div>

        {loading ? <p className="mt-4 text-base text-tinta-lembut">Memuat toko…</p> : null}
        {status === "masuk" && !user?.shop ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Kamu belum punya toko.</p>
            <Link href="/jualan" className={`${primaryButtonClass} mt-4 w-full`}>
              Buka toko
            </Link>
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

        {shop ? (
          <div className="mt-5 space-y-4">
            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-tinta">{shop.name}</p>
                  <p className="text-base text-tinta-lembut">
                    bakul/{shop.slug} · {shop.cityName}
                  </p>
                </div>
                <span className="rounded-pil bg-mint px-3 py-1 text-base font-semibold text-teal-aksi">
                  {SHOP_STATUS_LABEL[shop.status] ?? shop.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/toko/${shop.slug}`} className={secondaryButtonClass}>
                  Lihat halaman toko
                </Link>
                <Link href="/jualan/barang" className={secondaryButtonClass}>
                  Kelola {shop.productCount} barang
                </Link>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Profil toko</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-pil bg-mint-muda text-xl font-bold text-teal-aksi">
                  {shop.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.logoUrl}
                      alt={`Logo ${shop.name}`}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    shop.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <div>
                  <label className="block text-base font-semibold text-tinta" htmlFor="shop-logo">
                    Logo toko
                  </label>
                  <input
                    id="shop-logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-1 block min-h-11 w-full text-base text-tinta"
                    disabled={logoBusy}
                    onChange={(event) => void unggahLogo(event)}
                  />
                  <p className="text-base text-tinta-lembut">
                    {logoBusy ? "Mengunggah…" : "JPG, PNG, atau WebP. Maksimal 2 MB."}
                  </p>
                </div>
              </div>
              <label className={`${labelClass} mt-3`} htmlFor="shop-name">
                Nama toko
              </label>
              <input
                id="shop-name"
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
              />
              <label className={`${labelClass} mt-3`} htmlFor="shop-description">
                Cerita toko
              </label>
              <textarea
                id="shop-description"
                className={`${inputClass} min-h-24 py-3`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
              />
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Kurir yang dilayani</h2>
              <p className="mt-1 text-base text-tinta-lembut">
                Pembeli hanya bisa memilih kurir yang kamu aktifkan.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {COURIERS.map((courier) => (
                  <label
                    key={courier.code}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-kartu border p-3 ${
                      couriers.includes(courier.code)
                        ? "border-teal-aksi bg-mint-muda"
                        : "border-garis"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={couriers.includes(courier.code)}
                      onChange={() => toggleCourier(courier.code)}
                    />
                    <span className="text-base font-semibold text-tinta">{courier.name}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Rekening pencairan</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="bank-name">
                    Bank
                  </label>
                  <input
                    id="bank-name"
                    className={inputClass}
                    value={bankName}
                    onChange={(event) => setBankName(event.target.value)}
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="bank-account">
                    Nomor rekening
                  </label>
                  <input
                    id="bank-account"
                    inputMode="numeric"
                    className={inputClass}
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
                    maxLength={40}
                  />
                </div>
              </div>
              <label className={`${labelClass} mt-3`} htmlFor="bank-holder">
                Nama pemilik rekening
              </label>
              <input
                id="bank-holder"
                className={inputClass}
                value={holder}
                onChange={(event) => setHolder(event.target.value)}
                maxLength={120}
              />
            </section>

            <button
              type="button"
              className={`${primaryButtonClass} w-full`}
              disabled={busy}
              onClick={() => void simpan()}
            >
              {busy ? "Menyimpan…" : "Simpan pengaturan"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
