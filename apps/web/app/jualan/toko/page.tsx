"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { COURIERS, SHOP_STATUS_LABEL } from "@bakul/shared";
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
  fileInputClass,
  inputClass,
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
  const { notify } = useToast();
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
  const [formError, setFormError] = useState<string | null>(null);

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
      notify("Logo toko diperbarui.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Logo belum bisa diunggah.");
    } finally {
      setLogoBusy(false);
      event.target.value = "";
    }
  }

  async function simpan(): Promise<void> {
    if (!name.trim()) {
      setFormError("Nama toko wajib diisi.");
      return;
    }
    if (couriers.length === 0) {
      setFormError("Pilih minimal satu kurir.");
      return;
    }

    setBusy(true);
    setError(null);
    setFormError(null);
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
      notify("Pengaturan toko disimpan.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pengaturan belum bisa disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
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

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-32 w-full rounded-kartu" />
            <Skeleton className="h-64 w-full rounded-kartu" />
          </div>
        ) : null}
        {status === "masuk" && !user?.shop ? (
          <EmptyState
            icon="store"
            title="Kamu belum punya toko"
            description="Buka toko dulu, lalu pengaturan toko bisa diubah di sini."
            action={{ label: "Buka toko", href: "/jualan" }}
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
                <span className="inline-flex min-h-8 items-center rounded-pil bg-mint px-3 text-base font-semibold text-teal-tua">
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
                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-pil bg-mint-muda text-xl font-bold text-teal-aksi">
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
                <div className="min-w-0 flex-1">
                  <label className="block text-base font-semibold text-tinta" htmlFor="shop-logo">
                    Logo toko
                  </label>
                  <input
                    id="shop-logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className={`${fileInputClass} mt-1`}
                    disabled={logoBusy}
                    onChange={(event) => void unggahLogo(event)}
                  />
                  <p className="mt-1 text-base text-tinta-lembut">
                    {logoBusy ? "Mengunggah…" : "JPG, PNG, atau WebP. Maksimal 2 MB."}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Field label="Nama toko" htmlFor="shop-name">
                  {(props) => (
                    <input
                      {...props}
                      className={inputClass}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={120}
                    />
                  )}
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Cerita toko" htmlFor="shop-description">
                  {(props) => (
                    <textarea
                      {...props}
                      className={`${inputClass} min-h-24 py-3`}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={1000}
                    />
                  )}
                </Field>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Kurir yang dilayani</h2>
              <p className="mt-1 text-base text-tinta-lembut">
                Pembeli hanya bisa memilih kurir yang kamu aktifkan.
              </p>
              <div
                role="group"
                aria-label="Kurir yang dilayani"
                className="mt-3 grid gap-2 sm:grid-cols-2"
              >
                {COURIERS.map((courier) => {
                  const aktif = couriers.includes(courier.code);
                  return (
                    <label
                      key={courier.code}
                      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-kartu border p-3 transition duration-cepat ease-standar ${
                        aktif
                          ? "border-teal-aksi bg-mint-muda"
                          : "border-garis bg-putih hover:border-garis-kuat hover:bg-abu-kartu/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-6 w-6 shrink-0 accent-teal-aksi"
                        checked={aktif}
                        onChange={() => toggleCourier(courier.code)}
                      />
                      <span className="min-w-0 flex-1 text-base font-semibold text-tinta">
                        {courier.name}
                      </span>
                      {aktif ? (
                        <span className="shrink-0 text-teal-aksi">
                          <Icon name="check" size={20} />
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-2xl font-bold text-tinta">Rekening pencairan</h2>
              <p className="mt-1 text-base text-tinta-lembut">
                Dipakai saat kamu menarik saldo. Pastikan namamu sama seperti di bank.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Bank" htmlFor="bank-name">
                  {(props) => (
                    <input
                      {...props}
                      className={inputClass}
                      value={bankName}
                      onChange={(event) => setBankName(event.target.value)}
                      maxLength={60}
                    />
                  )}
                </Field>
                <Field label="Nomor rekening" htmlFor="bank-account">
                  {(props) => (
                    <input
                      {...props}
                      inputMode="numeric"
                      className={inputClass}
                      value={accountNumber}
                      onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
                      maxLength={40}
                    />
                  )}
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Nama pemilik rekening" htmlFor="bank-holder">
                  {(props) => (
                    <input
                      {...props}
                      className={inputClass}
                      value={holder}
                      onChange={(event) => setHolder(event.target.value)}
                      maxLength={120}
                    />
                  )}
                </Field>
              </div>
            </section>

            {formError ? (
              <div className={errorBoxClass} role="alert">
                {formError}
              </div>
            ) : null}

            <button
              type="button"
              className={`${primaryButtonClass} w-full`}
              disabled={busy}
              aria-busy={busy}
              onClick={() => void simpan()}
            >
              {busy ? (
                <>
                  <Icon name="refresh" size={18} className="animate-memuat" />
                  Menyimpan…
                </>
              ) : (
                "Simpan pengaturan"
              )}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
