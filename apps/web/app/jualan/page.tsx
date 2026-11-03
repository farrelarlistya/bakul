"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { formatRupiah, findWilayah, WILAYAH } from "@bakul/shared";
import { PhoneOtpForm } from "@/components/phone-otp-form";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { Icon } from "@/components/icon";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
import {
  cardClass,
  errorBoxClass,
  fileInputClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

type Stage = "auth" | "checking" | "shop" | "product" | "done";

type CreatedProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  shop: { id: string; name: string; slug: string };
};

const LANGKAH = [
  { key: "auth", label: "Akun" },
  { key: "shop", label: "Toko" },
  { key: "product", label: "Barang" },
];

export default function JualanPage() {
  const { status, user, login, request, refreshUser } = useAuth();
  const { notify } = useToast();
  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [shopName, setShopName] = useState("");
  const [cityId, setCityId] = useState(WILAYAH[0]?.cityId ?? "");
  const [description, setDescription] = useState("");
  const [shopNameError, setShopNameError] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("250");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(null);
  const [productNameError, setProductNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "memuat") {
      return;
    }

    if (status === "tamu") {
      if (stage !== "auth") {
        setStage("auth");
      }
      return;
    }

    if (stage === null) {
      setStage(user?.shop ? "checking" : "shop");
      return;
    }

    if (stage === "auth") {
      setStage(user?.shop ? "checking" : "shop");
    }
  }, [status, user, stage]);

  useEffect(() => {
    if (stage !== "checking" || status !== "masuk" || !user?.shop) {
      return;
    }

    let alive = true;

    void request<{ productCount: number }>("/api/v1/seller/shop")
      .then((shop) => {
        if (alive) {
          setStage(shop.productCount === 0 ? "product" : "done");
        }
      })
      .catch(() => {
        if (alive) {
          setStage("done");
        }
      });

    return () => {
      alive = false;
    };
  }, [stage, status, user?.shop, request]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function pilihKota(value: string): void {
    setCityId(value);
  }

  async function simpanToko(): Promise<void> {
    const city = findWilayah(cityId);
    if (!city) {
      setError("Pilih kota tokomu dulu.");
      return;
    }
    if (shopName.trim().length < 2) {
      setShopNameError("Nama toko perlu minimal 2 huruf.");
      return;
    }

    setBusy(true);
    setError(null);
    setShopNameError(null);

    try {
      await request("/api/v1/onboarding/shop", {
        method: "POST",
        body: JSON.stringify({
          name: shopName,
          cityId: city.cityId,
          cityName: city.cityName,
          description: description.trim() || undefined,
        }),
      });
      await refreshUser();
      setStage("product");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Toko belum bisa dibuat.");
    } finally {
      setBusy(false);
    }
  }

  function pilihFoto(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function simpanProduk(): Promise<void> {
    if (productName.trim().length < 2) {
      setProductNameError("Nama barang perlu minimal 2 huruf.");
      return;
    }
    if (Number(price) < 1_000) {
      setPriceError("Harga minimal Rp 1.000.");
      return;
    }

    setBusy(true);
    setError(null);
    setProductNameError(null);
    setPriceError(null);

    try {
      const form = new FormData();
      form.append("name", productName);
      form.append("price", price);
      form.append("weightGram", weight || "250");
      if (photo) {
        form.append("photo", photo);
      }

      const created = await request<CreatedProduct>("/api/v1/onboarding/first-product", {
        method: "POST",
        body: form,
      });
      setCreatedProduct(created);
      await refreshUser();
      setStage("done");
      notify("Barang pertama tersimpan. Tokomu sudah siap.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa disimpan.");
    } finally {
      setBusy(false);
    }
  }

  const tahapSekarang = LANGKAH.findIndex((item) => item.key === stage);

  return (
    <main className="min-h-screen bg-krem">
      <AppHeader />
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6">
          <p className="text-base font-semibold text-teal-aksi">Buka toko gratis</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
            Daganganmu, dibuka hari ini.
          </h1>
          <p className="mt-2 text-base text-tinta-lembut">
            Cukup nomor HP. Tanpa email, tanpa KTP.
          </p>
        </div>

        <ol className="mb-6 flex items-center gap-2" aria-label="Langkah buka toko">
          {LANGKAH.map((step, index) => {
            const aktif =
              stage === step.key ||
              (step.key === "auth" && stage !== null) ||
              (step.key === "shop" &&
                (stage === "checking" || stage === "product" || stage === "done")) ||
              (step.key === "product" && stage === "done");
            const selesai = tahapSekarang > index && tahapSekarang >= 0;

            return (
              <li key={step.key} className="flex flex-1 items-center gap-2">
                <span
                  className={`inline-flex min-h-9 items-center gap-2 rounded-pil px-3 text-base font-semibold transition duration-sedang ease-standar ${
                    aktif
                      ? "bg-teal-aksi text-putih"
                      : "bg-putih text-tinta-lembut"
                  }`}
                  aria-current={aktif ? "step" : undefined}
                >
                  {selesai ? (
                    <Icon name="check" size={16} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  {step.label}
                </span>
                {index < LANGKAH.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={`h-0.5 flex-1 rounded-pil ${selesai ? "bg-teal-aksi" : "bg-garis"}`}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        {status === "memuat" || stage === null || stage === "checking" ? (
          <div className={cardClass}>
            <p className="text-base text-tinta-lembut">Memeriksa akun dan toko…</p>
          </div>
        ) : null}

        {stage === "auth" ? (
          <div className={cardClass}>
            <h2 className="font-display text-2xl font-bold text-tinta">Masuk atau daftar</h2>
            <p className="mt-2 text-base text-tinta-lembut">
              Kami kirim kode 6 angka ke HP-mu.
            </p>
            <div className="mt-5">
              <PhoneOtpForm
                mode="register"
                onSuccess={(session) => {
                  login(session);
                }}
              />
            </div>
          </div>
        ) : null}

        {stage === "shop" ? (
          <div className={cardClass}>
            <h2 className="font-display text-2xl font-bold text-tinta">Beri nama tokomu</h2>
            <p className="mt-2 text-base text-tinta-lembut">
              Nama ini yang dilihat pembeli. Bisa diubah nanti.
            </p>

            <div className="mt-5 space-y-4">
              <Field
                label="Nama toko"
                htmlFor="shop-name"
                error={shopNameError}
                hint="Contoh: Dapur Bu Sri"
              >
                {(props) => (
                  <input
                    {...props}
                    className={inputClass}
                    value={shopName}
                    onChange={(event) => {
                      setShopName(event.target.value);
                      if (shopNameError) {
                        setShopNameError(null);
                      }
                    }}
                    placeholder="Contoh: Dapur Bu Sri"
                  />
                )}
              </Field>

              <Field label="Kota" htmlFor="shop-city">
                {(props) => (
                  <select
                    {...props}
                    className={selectClass}
                    value={cityId}
                    onChange={(event) => pilihKota(event.target.value)}
                  >
                    {WILAYAH.map((city) => (
                      <option key={city.cityId} value={city.cityId}>
                        {city.cityName}, {city.provinceName}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field
                label="Cerita toko"
                htmlFor="shop-description"
                hint="Boleh dikosongkan."
              >
                {(props) => (
                  <textarea
                    {...props}
                    className={`${inputClass} min-h-24 py-3`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Contoh: Kue kering rumahan dari Sleman."
                  />
                )}
              </Field>

              {error ? (
                <div className={errorBoxClass} role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                className={`${primaryButtonClass} w-full`}
                disabled={busy || shopName.trim().length < 2}
                aria-busy={busy}
                onClick={() => void simpanToko()}
              >
                {busy ? (
                  <>
                    <Icon name="refresh" size={18} className="animate-memuat" />
                    Menyiapkan toko…
                  </>
                ) : (
                  "Buat toko"
                )}
              </button>
            </div>
          </div>
        ) : null}

        {stage === "product" ? (
          <div className={cardClass}>
            <h2 className="font-display text-2xl font-bold text-tinta">
              Unggah barang pertama
            </h2>
            <p className="mt-2 text-base text-tinta-lembut">
              Foto yang jelas bikin pembeli percaya.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-base font-semibold text-tinta" htmlFor="product-photo">
                  Foto barang <span className="font-normal text-tinta-lembut">(opsional)</span>
                </label>
                <div className="rounded-kartu border border-garis bg-mint-muda p-3">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Pratinjau foto barang"
                      width={320}
                      height={180}
                      className="h-40 w-full rounded-tombol object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Icon name="camera" size={32} className="text-teal-aksi" />
                      <p className="text-base text-tinta-lembut">
                        Belum ada foto. Pilih dari galeri.
                      </p>
                    </div>
                  )}
                  <input
                    id="product-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={pilihFoto}
                    className={`${fileInputClass} mt-3`}
                  />
                </div>
              </div>

              <div className="rounded-kartu border border-garis-kuat bg-abu-kartu p-3">
                <p className="text-base font-semibold text-tinta">Tips foto</p>
                <ol className="mt-2 space-y-1 text-base text-tinta-lembut">
                  <li>1. Gunakan latar polos.</li>
                  <li>2. Ambil dari atas.</li>
                  <li>3. Pastikan cahaya terang.</li>
                </ol>
              </div>

              <Field
                label="Nama barang"
                htmlFor="product-name"
                error={productNameError}
                hint="Contoh: Nastar Premium"
              >
                {(props) => (
                  <input
                    {...props}
                    className={inputClass}
                    value={productName}
                    onChange={(event) => {
                      setProductName(event.target.value);
                      if (productNameError) {
                        setProductNameError(null);
                      }
                    }}
                    placeholder="Contoh: Nastar Premium"
                  />
                )}
              </Field>

              <Field
                label="Harga"
                htmlFor="product-price"
                error={priceError}
                hint="Tulis angka tanpa titik, contoh 45000."
              >
                {(props) => (
                  <input
                    {...props}
                    inputMode="numeric"
                    className={inputClass}
                    value={price}
                    onChange={(event) => {
                      setPrice(event.target.value.replace(/\D/g, ""));
                      if (priceError) {
                        setPriceError(null);
                      }
                    }}
                    placeholder="45000"
                  />
                )}
              </Field>
              <p className="-mt-2 text-base text-tinta-lembut">
                {price ? formatRupiah(Number(price)) : "Belum diisi."}
              </p>

              <Field label="Berat (gram)" htmlFor="product-weight">
                {(props) => (
                  <input
                    {...props}
                    inputMode="numeric"
                    className={inputClass}
                    value={weight}
                    onChange={(event) => setWeight(event.target.value.replace(/\D/g, ""))}
                    placeholder="250"
                  />
                )}
              </Field>

              {error ? (
                <div className={errorBoxClass} role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                className={`${primaryButtonClass} w-full`}
                disabled={busy || productName.trim().length < 2 || Number(price) < 1_000}
                aria-busy={busy}
                onClick={() => void simpanProduk()}
              >
                {busy ? (
                  <>
                    <Icon name="refresh" size={18} className="animate-memuat" />
                    Menyimpan barang…
                  </>
                ) : (
                  "Simpan & buka toko"
                )}
              </button>
            </div>
          </div>
        ) : null}

        {stage === "done" ? (
          <div className={`${cardClass} border border-teal bg-mint-muda`}>
            <p className="text-base font-semibold text-teal-aksi">
              {createdProduct ? "Barang pertama tersimpan" : "Toko sudah siap"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-tinta">
              {createdProduct ? createdProduct.name : user?.shop?.name ?? "Toko kamu"}
            </h2>

            {createdProduct ? (
              <div className="mt-4 rounded-kartu border border-garis bg-putih p-3">
                {createdProduct.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={createdProduct.imageUrl}
                    alt={createdProduct.name}
                    width={480}
                    height={240}
                    className="h-40 w-full rounded-tombol object-cover"
                  />
                ) : null}
                <p className="mt-3 text-lg font-semibold text-tinta">
                  {formatRupiah(createdProduct.price)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-base text-tinta-lembut">
                Toko kamu sudah aktif. Barang bisa ditambah dari halaman toko.
              </p>
            )}

            <div className="mt-5 space-y-3">
              <Link href="/jualan/barang" className={`${primaryButtonClass} w-full`}>
                Kelola barang
              </Link>
              <Link href="/akun" className={`${secondaryButtonClass} w-full`}>
                Lihat akun dan alamat
              </Link>
              <Link href="/inbox" className={`${secondaryButtonClass} w-full`}>
                Buka Inbox
              </Link>
            </div>
          </div>
        ) : null}

        {stage === null ? (
          <EmptyState icon="store" title="Menyiapkan halaman…" />
        ) : null}
      </div>
    </main>
  );
}
