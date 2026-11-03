"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { formatRupiah, findWilayah, WILAYAH } from "@bakul/shared";
import { PhoneOtpForm } from "@/components/phone-otp-form";
import { AppHeader } from "@/components/app-header";
import {
  cardClass,
  errorBoxClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
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

export default function JualanPage() {
  const { status, user, login, request, refreshUser } = useAuth();
  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [shopName, setShopName] = useState("");
  const [cityId, setCityId] = useState(WILAYAH[0]?.cityId ?? "");
  const [description, setDescription] = useState("");

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("250");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(null);

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

    setBusy(true);
    setError(null);

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
    setBusy(true);
    setError(null);

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
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa disimpan.");
    } finally {
      setBusy(false);
    }
  }

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

        <ol className="mb-6 flex flex-wrap gap-2" aria-label="Langkah buka toko">
          {[
            { key: "auth", label: "1 · Akun" },
            { key: "shop", label: "2 · Toko" },
            { key: "product", label: "3 · Barang" },
          ].map((step) => {
            const active =
              stage === step.key ||
              (step.key === "auth" && stage !== null) ||
              (step.key === "shop" &&
                (stage === "checking" || stage === "product" || stage === "done")) ||
              (step.key === "product" && stage === "done");
            return (
              <li
                key={step.key}
                className={`inline-flex min-h-9 items-center rounded-pil px-3 text-base font-semibold ${
                  active ? "bg-teal-aksi text-putih" : "bg-putih text-tinta-lembut"
                }`}
              >
                {step.label}
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
              <div>
                <label className={labelClass} htmlFor="shop-name">
                  Nama toko
                </label>
                <input
                  id="shop-name"
                  className={inputClass}
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder="Contoh: Dapur Bu Sri"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="shop-city">
                  Kota
                </label>
                <select
                  id="shop-city"
                  className={inputClass}
                  value={cityId}
                  onChange={(event) => pilihKota(event.target.value)}
                >
                  {WILAYAH.map((city) => (
                    <option key={city.cityId} value={city.cityId}>
                      {city.cityName}, {city.provinceName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="shop-description">
                  Cerita toko <span className="font-normal text-tinta-lembut">(opsional)</span>
                </label>
                <textarea
                  id="shop-description"
                  className={`${inputClass} min-h-24 py-3`}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Contoh: Kue kering rumahan dari Sleman."
                />
              </div>

              {error ? (
                <div className={errorBoxClass} role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                className={`${primaryButtonClass} w-full`}
                disabled={busy || shopName.trim().length < 2}
                onClick={() => void simpanToko()}
              >
                {busy ? "Menyiapkan toko…" : "Buat toko"}
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
                <label className={labelClass} htmlFor="product-photo">
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
                    <p className="py-10 text-center text-base text-tinta-lembut">
                      Belum ada foto. Pilih dari galeri.
                    </p>
                  )}
                  <input
                    id="product-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={pilihFoto}
                    className="mt-3 block min-h-11 w-full text-base text-tinta"
                  />
                </div>
              </div>

              <div>
                <p className="text-base font-semibold text-tinta">Tips foto</p>
                <ol className="mt-2 space-y-1 text-base text-tinta-lembut">
                  <li>1. Gunakan latar polos.</li>
                  <li>2. Ambil dari atas.</li>
                  <li>3. Pastikan cahaya terang.</li>
                </ol>
              </div>

              <div>
                <label className={labelClass} htmlFor="product-name">
                  Nama barang
                </label>
                <input
                  id="product-name"
                  className={inputClass}
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Contoh: Nastar Premium"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="product-price">
                  Harga
                </label>
                <input
                  id="product-price"
                  inputMode="numeric"
                  className={inputClass}
                  value={price}
                  onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))}
                  placeholder="45000"
                />
                <p className="mt-1 text-base text-tinta-lembut">
                  {price ? formatRupiah(Number(price)) : "Tulis angka tanpa titik, contoh 45000."}
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="product-weight">
                  Berat <span className="font-normal text-tinta-lembut">(gram)</span>
                </label>
                <input
                  id="product-weight"
                  inputMode="numeric"
                  className={inputClass}
                  value={weight}
                  onChange={(event) => setWeight(event.target.value.replace(/\D/g, ""))}
                  placeholder="250"
                />
              </div>

              {error ? (
                <div className={errorBoxClass} role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                className={`${primaryButtonClass} w-full`}
                disabled={busy || productName.trim().length < 2 || Number(price) < 1_000}
                onClick={() => void simpanProduk()}
              >
                {busy ? "Menyimpan barang…" : "Simpan & buka toko"}
              </button>
            </div>
          </div>
        ) : null}

        {stage === "done" ? (
          <div className={`${cardClass} bg-mint-muda`}>
            <p className="text-base font-semibold text-teal-aksi">
              {createdProduct ? "Barang pertama tersimpan" : "Toko sudah siap"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-tinta">
              {createdProduct ? createdProduct.name : user?.shop?.name ?? "Toko kamu"}
            </h2>

            {createdProduct ? (
              <div className="mt-4 rounded-kartu bg-putih p-3">
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
      </div>
    </main>
  );
}
