"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  formatRupiah,
  type CategorySummary,
} from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

type SellerProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  weightGram: number;
  rating: number;
  soldCount: number;
  category: { id: string; name: string; slug: string };
  etalase: { id: string; name: string } | null;
  price: number;
  stock: number;
  variants: {
    id: string;
    sku: string;
    name: string;
    price: number;
    stockAvailable: number;
  }[];
  images: { id: string; url: string; position: number }[];
};

type Etalase = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { products: number };
};

type VariantRow = {
  id?: string;
  name: string;
  price: string;
  stock: string;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  DELETED: "Dihapus",
  DRAFT: "Draf",
};

export default function SellerProductsPage() {
  const { status, user, request } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [etalases, setEtalases] = useState<Etalase[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [etalaseId, setEtalaseId] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("250");
  const [variants, setVariants] = useState<VariantRow[]>([
    { name: "Standar", price: "", stock: "10" },
  ]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newEtalaseName, setNewEtalaseName] = useState("");
  const formRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [productItems, etalaseItems, categoryItems] = await Promise.all([
        request<SellerProduct[]>("/api/v1/seller/products"),
        request<Etalase[]>("/api/v1/seller/etalases"),
        request<CategorySummary[]>("/api/v1/categories"),
      ]);
      setProducts(productItems);
      setEtalases(etalaseItems);
      setCategories(categoryItems);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (status === "masuk" && user?.shop) {
      void load();
    }
  }, [status, user?.shop, load]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (formOpen) {
      formRef.current?.scrollIntoView({ block: "start" });
    }
  }, [formOpen, editingId]);

  function resetForm(): void {
    setEditingId(null);
    setName("");
    setCategoryId(categories[0]?.id ?? "");
    setEtalaseId("");
    setDescription("");
    setWeight("250");
    setVariants([{ name: "Standar", price: "", stock: "10" }]);
    setPhoto(null);
    setPreview(null);
    setExistingImage(null);
    setError(null);
    setMessage(null);
  }

  function openCreate(): void {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(product: SellerProduct): void {
    setEditingId(product.id);
    setName(product.name);
    setCategoryId(product.category.id);
    setEtalaseId(product.etalase?.id ?? "");
    setDescription(product.description);
    setWeight(String(product.weightGram));
    setVariants(
      product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: String(variant.price),
        stock: String(variant.stockAvailable),
      })),
    );
    setPhoto(null);
    setPreview(null);
    setExistingImage(product.images[0]?.url ?? null);
    setFormOpen(true);
    setMessage(null);
    setError(null);
  }

  function pilihFoto(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function ubahVariant(index: number, field: keyof VariantRow, value: string): void {
    setVariants((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function tambahVariant(): void {
    if (variants.length >= 5) {
      setError("Maksimal 5 pilihan per barang.");
      return;
    }
    setVariants((current) => [...current, { name: "", price: "", stock: "0" }]);
  }

  async function hapusVariant(index: number): Promise<void> {
    const row = variants[index];
    if (!row) {
      return;
    }

    if (row.id) {
      if (!editingId || !window.confirm("Hapus pilihan ini?")) {
        return;
      }

      try {
        setBusy(true);
        const updated = await request<SellerProduct>(
          `/api/v1/seller/products/${editingId}/variants/${row.id}`,
          { method: "DELETE" },
        );
        setVariants(
          updated.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: String(variant.price),
            stock: String(variant.stockAvailable),
          })),
        );
        setProducts((current) =>
          current.map((product) => (product.id === updated.id ? updated : product)),
        );
        setMessage("Pilihan dihapus.");
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : "Pilihan belum bisa dihapus.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (variants.length <= 1) {
      setError("Barang harus punya minimal satu pilihan.");
      return;
    }

    setVariants((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  async function uploadImage(productId: string): Promise<void> {
    if (!photo) {
      return;
    }

    const form = new FormData();
    form.append("photo", photo);
    await request(`/api/v1/seller/products/${productId}/images`, {
      method: "POST",
      body: form,
    });
  }

  async function simpan(): Promise<void> {
    if (!categoryId) {
      setError("Pilih kategori dulu.");
      return;
    }

    if (variants.length === 0) {
      setError("Isi minimal satu pilihan.");
      return;
    }

    for (const variant of variants) {
      if (!variant.name.trim() || Number(variant.price) < 1_000) {
        setError("Setiap pilihan perlu nama dan harga minimal Rp 1.000.");
        return;
      }
    }

    const wasEditing = editingId !== null;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (editingId) {
        await request(`/api/v1/seller/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name,
            categoryId,
            etalaseId: etalaseId || null,
            description,
            weightGram: Number(weight) || 250,
          }),
        });

        for (const variant of variants) {
          if (variant.id) {
            await request(
              `/api/v1/seller/products/${editingId}/variants/${variant.id}`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  name: variant.name,
                  price: Number(variant.price),
                  stockAvailable: Number(variant.stock),
                }),
              },
            );
          } else {
            await request(`/api/v1/seller/products/${editingId}/variants`, {
              method: "POST",
              body: JSON.stringify({
                name: variant.name,
                price: Number(variant.price),
                stockAvailable: Number(variant.stock),
              }),
            });
          }
        }

        await uploadImage(editingId);
      } else {
        const created = await request<SellerProduct>("/api/v1/seller/products", {
          method: "POST",
          body: JSON.stringify({
            name,
            categoryId,
            etalaseId: etalaseId || null,
            description,
            weightGram: Number(weight) || 250,
            variants: variants.map((variant) => ({
              name: variant.name,
              price: Number(variant.price),
              stockAvailable: Number(variant.stock),
            })),
          }),
        });
        await uploadImage(created.id);
      }

      setFormOpen(false);
      resetForm();
      await load();
      setMessage(wasEditing ? "Barang diperbarui." : "Barang ditambahkan.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function ubahStatus(product: SellerProduct): Promise<void> {
    const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusy(true);
    setError(null);

    try {
      const updated = await request<SellerProduct>(
        `/api/v1/seller/products/${product.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        },
      );
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(next === "ACTIVE" ? "Barang diaktifkan." : "Barang dinonaktifkan.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Status belum bisa diubah.");
    } finally {
      setBusy(false);
    }
  }

  async function hapusBarang(product: SellerProduct): Promise<void> {
    if (!window.confirm(`Hapus “${product.name}” dari katalog?`)) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const updated = await request<SellerProduct>(
        `/api/v1/seller/products/${product.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "DELETED" }),
        },
      );
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage("Barang disembunyikan dari katalog.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa dihapus.");
    } finally {
      setBusy(false);
    }
  }

  async function tambahEtalase(): Promise<void> {
    if (!newEtalaseName.trim()) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await request("/api/v1/seller/etalases", {
        method: "POST",
        body: JSON.stringify({ name: newEtalaseName }),
      });
      setNewEtalaseName("");
      await load();
      setMessage("Etalase ditambahkan.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Etalase belum bisa dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function ubahEtalase(etalase: Etalase): Promise<void> {
    const name = window.prompt("Nama etalase baru", etalase.name);
    if (!name?.trim()) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await request(`/api/v1/seller/etalases/${etalase.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await load();
      setMessage("Etalase diubah.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Etalase belum bisa diubah.");
    } finally {
      setBusy(false);
    }
  }

  async function hapusEtalase(etalase: Etalase): Promise<void> {
    if (!window.confirm(`Hapus etalase “${etalase.name}”? Barang di dalamnya tetap ada.`)) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await request(`/api/v1/seller/etalases/${etalase.id}`, { method: "DELETE" });
      await load();
      setMessage("Etalase dihapus.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Etalase belum bisa dihapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Toko kamu</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
              Barang dagangan
            </h1>
            <p className="mt-2 text-base text-tinta-lembut">
              Tambah, ubah, atur stok, dan sembunyikan barang.
            </p>
          </div>
          <Link href="/akun" className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi">
            Kembali ke akun
          </Link>
        </div>

        {status === "memuat" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Memeriksa akun…</p>
          </div>
        ) : null}

        {status === "tamu" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk mengelola barang.</p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
        ) : null}

        {status === "masuk" && !user?.shop ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">
              Kamu belum punya toko. Buka toko dulu, lalu barang bisa ditambahkan.
            </p>
            <Link href="/jualan" className={`${primaryButtonClass} mt-4 w-full`}>
              Buka toko
            </Link>
          </div>
        ) : null}

        {status === "masuk" && user?.shop ? (
          <>
            {error ? (
              <div className={`${errorBoxClass} mt-5`} role="alert">
                {error}
              </div>
            ) : null}
            {message ? (
              <p className="mt-5 rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">
                {message}
              </p>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className={cardClass} aria-labelledby="daftar-barang">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="daftar-barang" className="font-display text-2xl font-bold text-tinta">
                    Daftar barang
                  </h2>
                  <button type="button" className={primaryButtonClass} onClick={openCreate}>
                    Tambah barang
                  </button>
                </div>

                {loading ? (
                  <p className="mt-4 text-base text-tinta-lembut">Memuat barang…</p>
                ) : null}

                <div className="mt-4 space-y-3">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="rounded-kartu border border-garis bg-abu-kartu p-3"
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-tombol bg-mint-muda">
                          {product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              width={80}
                              height={80}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-2xl font-bold text-teal-aksi">
                              {product.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-base font-semibold text-tinta">{product.name}</p>
                            <span
                              className={`rounded-pil px-2 text-base font-semibold ${
                                product.status === "ACTIVE"
                                  ? "bg-mint text-teal-tua"
                                  : "bg-krem text-tinta-lembut"
                              }`}
                            >
                              {STATUS_LABEL[product.status] ?? product.status}
                            </span>
                          </div>
                          <p className="mt-1 text-base text-tinta-lembut">
                            {formatRupiah(product.price)} · stok {product.stock} ·{" "}
                            {product.variants.length} pilihan
                          </p>
                          <p className="mt-1 text-base text-tinta-lembut">
                            {product.category.name}
                            {product.etalase ? ` · ${product.etalase.name}` : ""}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={secondaryButtonClass}
                              onClick={() => openEdit(product)}
                            >
                              Ubah
                            </button>
                            <button
                              type="button"
                              className={secondaryButtonClass}
                              disabled={busy}
                              onClick={() => void ubahStatus(product)}
                            >
                              {product.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            {product.status !== "DELETED" ? (
                              <button
                                type="button"
                                className={dangerButtonClass}
                                disabled={busy}
                                onClick={() => void hapusBarang(product)}
                              >
                                Hapus
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!loading && products.length === 0 ? (
                    <p className="text-base text-tinta-lembut">
                      Belum ada barang. Klik “Tambah barang”.
                    </p>
                  ) : null}
                </div>
              </section>

              <div className="space-y-6">
                <section className={cardClass} aria-labelledby="etalase">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="etalase" className="font-display text-2xl font-bold text-tinta">
                      Etalase
                    </h2>
                  </div>
                  <p className="mt-2 text-base text-tinta-lembut">
                    Kelompokkan barang agar toko mudah dilihat.
                  </p>
                  <div className="mt-3 space-y-2">
                    {etalases.map((etalase) => (
                      <div
                        key={etalase.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-kartu border border-garis p-3"
                      >
                        <div>
                          <p className="text-base font-semibold text-tinta">{etalase.name}</p>
                          <p className="text-base text-tinta-lembut">
                            {etalase._count?.products ?? 0} barang
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={secondaryButtonClass}
                            disabled={busy}
                            onClick={() => void ubahEtalase(etalase)}
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            className={dangerButtonClass}
                            disabled={busy}
                            onClick={() => void hapusEtalase(etalase)}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className={inputClass}
                      value={newEtalaseName}
                      onChange={(event) => setNewEtalaseName(event.target.value)}
                      placeholder="Nama etalase baru"
                      aria-label="Nama etalase baru"
                    />
                    <button
                      type="button"
                      className={primaryButtonClass}
                      disabled={busy || !newEtalaseName.trim()}
                      onClick={() => void tambahEtalase()}
                    >
                      Tambah
                    </button>
                  </div>
                </section>

                {formOpen ? (
                  <section
                    ref={formRef}
                    className={cardClass}
                    aria-labelledby="form-barang"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 id="form-barang" className="font-display text-2xl font-bold text-tinta">
                        {editingId ? "Ubah barang" : "Barang baru"}
                      </h2>
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi"
                        onClick={() => {
                          setFormOpen(false);
                          resetForm();
                        }}
                      >
                        Tutup
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className={labelClass} htmlFor="form-name">
                          Nama barang
                        </label>
                        <input
                          id="form-name"
                          className={inputClass}
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass} htmlFor="form-category">
                            Kategori
                          </label>
                          <select
                            id="form-category"
                            className={inputClass}
                            value={categoryId}
                            onChange={(event) => setCategoryId(event.target.value)}
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="form-etalase">
                            Etalase
                          </label>
                          <select
                            id="form-etalase"
                            className={inputClass}
                            value={etalaseId}
                            onChange={(event) => setEtalaseId(event.target.value)}
                          >
                            <option value="">Tanpa etalase</option>
                            {etalases.map((etalase) => (
                              <option key={etalase.id} value={etalase.id}>
                                {etalase.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="form-description">
                          Deskripsi
                        </label>
                        <textarea
                          id="form-description"
                          className={`${inputClass} min-h-24 py-3`}
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                        />
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="form-weight">
                          Berat (gram)
                        </label>
                        <input
                          id="form-weight"
                          inputMode="numeric"
                          className={inputClass}
                          value={weight}
                          onChange={(event) =>
                            setWeight(event.target.value.replace(/\D/g, ""))
                          }
                        />
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="form-photo">
                          Foto barang
                        </label>
                        <div className="rounded-kartu border border-garis bg-mint-muda p-3">
                          {preview || existingImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={preview ?? existingImage ?? ""}
                              alt="Pratinjau barang"
                              width={320}
                              height={180}
                              className="h-32 w-full rounded-tombol object-cover"
                            />
                          ) : (
                            <p className="py-8 text-center text-base text-tinta-lembut">
                              Belum ada foto.
                            </p>
                          )}
                          <input
                            id="form-photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={pilihFoto}
                            className="mt-2 block min-h-11 w-full text-base text-tinta"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={labelClass}>Pilihan dan stok</p>
                          <button
                            type="button"
                            className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi"
                            onClick={tambahVariant}
                          >
                            Tambah pilihan
                          </button>
                        </div>
                        <div className="space-y-3">
                          {variants.map((variant, index) => (
                            <div key={variant.id ?? `baru-${index}`} className="rounded-kartu border border-garis p-3">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <input
                                  className={inputClass}
                                  value={variant.name}
                                  onChange={(event) =>
                                    ubahVariant(index, "name", event.target.value)
                                  }
                                  placeholder="Nama pilihan"
                                  aria-label={`Nama pilihan ${index + 1}`}
                                />
                                <input
                                  className={inputClass}
                                  inputMode="numeric"
                                  value={variant.price}
                                  onChange={(event) =>
                                    ubahVariant(
                                      index,
                                      "price",
                                      event.target.value.replace(/\D/g, ""),
                                    )
                                  }
                                  placeholder="Harga"
                                  aria-label={`Harga pilihan ${index + 1}`}
                                />
                                <input
                                  className={inputClass}
                                  inputMode="numeric"
                                  value={variant.stock}
                                  onChange={(event) =>
                                    ubahVariant(
                                      index,
                                      "stock",
                                      event.target.value.replace(/\D/g, ""),
                                    )
                                  }
                                  placeholder="Stok"
                                  aria-label={`Stok pilihan ${index + 1}`}
                                />
                              </div>
                              <button
                                type="button"
                                className="mt-2 inline-flex min-h-11 items-center text-base font-semibold text-bahaya"
                                onClick={() => void hapusVariant(index)}
                              >
                                Hapus pilihan
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`${primaryButtonClass} w-full`}
                        disabled={busy || !name.trim() || variants.length === 0}
                        onClick={() => void simpan()}
                      >
                        {busy ? "Menyimpan…" : editingId ? "Simpan perubahan" : "Simpan barang"}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
