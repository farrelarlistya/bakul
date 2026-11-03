"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  formatRupiah,
  type CategorySummary,
} from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { Icon } from "@/components/icon";
import { PromptDialog } from "@/components/prompt-dialog";
import { SkeletonRow } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  fileInputClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
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

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-mint-muda text-teal-aksi",
  INACTIVE: "bg-krem text-perhatian-tua",
  DELETED: "bg-abu-kartu text-tinta-lembut",
  DRAFT: "bg-abu-kartu text-tinta-lembut",
};

export default function SellerProductsPage() {
  const { status, user, request } = useAuth();
  const { notify } = useToast();
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
  const [formError, setFormError] = useState<string | null>(null);
  const [newEtalaseName, setNewEtalaseName] = useState("");
  const [hapusProduk, setHapusProduk] = useState<SellerProduct | null>(null);
  const [hapusEtalaseDialog, setHapusEtalaseDialog] = useState<Etalase | null>(null);
  const [ubahEtalase, setUbahEtalase] = useState<Etalase | null>(null);
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
    setFormError(null);
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
    setFormError(null);
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
      setFormError("Maksimal 5 pilihan per barang.");
      return;
    }
    setFormError(null);
    setVariants((current) => [...current, { name: "", price: "", stock: "0" }]);
  }

  async function hapusVariant(index: number): Promise<void> {
    const row = variants[index];
    if (!row) {
      return;
    }

    if (row.id) {
      if (!editingId) {
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
        notify("Pilihan dihapus.");
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : "Pilihan belum bisa dihapus.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (variants.length <= 1) {
      setFormError("Barang harus punya minimal satu pilihan.");
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
      setFormError("Pilih kategori dulu.");
      return;
    }

    if (variants.length === 0) {
      setFormError("Isi minimal satu pilihan.");
      return;
    }

    for (const variant of variants) {
      if (!variant.name.trim() || Number(variant.price) < 1_000) {
        setFormError("Setiap pilihan perlu nama dan harga minimal Rp 1.000.");
        return;
      }
    }

    const wasEditing = editingId !== null;
    setBusy(true);
    setError(null);
    setMessage(null);
    setFormError(null);

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
      notify(wasEditing ? "Barang diperbarui." : "Barang ditambahkan.");
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
      notify(next === "ACTIVE" ? "Barang diaktifkan." : "Barang dinonaktifkan.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Status belum bisa diubah.");
    } finally {
      setBusy(false);
    }
  }

  async function hapusBarang(product: SellerProduct): Promise<void> {
    setHapusProduk(null);
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
      notify("Barang disembunyikan dari katalog.");
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
      notify("Etalase ditambahkan.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Etalase belum bisa dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function simpanUbahEtalase(nama: string): Promise<void> {
    if (!ubahEtalase) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await request(`/api/v1/seller/etalases/${ubahEtalase.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: nama }),
      });
      await load();
      setMessage("Etalase diubah.");
      notify("Etalase diubah.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Etalase belum bisa diubah.");
    } finally {
      setBusy(false);
    }
  }

  async function hapusEtalase(etalase: Etalase): Promise<void> {
    setHapusEtalaseDialog(null);
    setBusy(true);
    setError(null);

    try {
      await request(`/api/v1/seller/etalases/${etalase.id}`, { method: "DELETE" });
      await load();
      setMessage("Etalase dihapus.");
      notify("Etalase dihapus.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Etalase belum bisa dihapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-[1200px] px-4 py-8">
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
          <Link
            href="/akun"
            className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
          >
            <Icon name="arrowLeft" size={18} />
            Kembali ke akun
          </Link>
        </div>

        {status === "memuat" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Memeriksa akun…</p>
          </div>
        ) : null}

        {status === "tamu" ? (
          <EmptyState
            icon="user"
            title="Masuk dulu untuk mengelola barang"
            description="Masuk dengan nomor HP, lalu barang tokomu bisa dikelola di sini."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {status === "masuk" && !user?.shop ? (
          <EmptyState
            icon="store"
            title="Kamu belum punya toko"
            description="Buka toko dulu, lalu barang bisa ditambahkan."
            action={{ label: "Buka toko", href: "/jualan" }}
            className="mt-6"
          />
        ) : null}

        {status === "masuk" && user?.shop ? (
          <>
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

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className={cardClass} aria-labelledby="daftar-barang">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="daftar-barang" className="font-display text-2xl font-bold text-tinta">
                    Daftar barang
                  </h2>
                  <button type="button" className={primaryButtonClass} onClick={openCreate}>
                    <Icon name="plus" size={18} />
                    Tambah barang
                  </button>
                </div>

                {loading ? (
                  <div className="mt-4 space-y-3">
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="rounded-kartu border border-garis bg-abu-kartu p-3 transition duration-sedang ease-standar hover:border-garis-kuat"
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
                              className={`inline-flex min-h-8 items-center rounded-pil px-3 text-base font-semibold ${
                                STATUS_TONE[product.status] ?? "bg-abu-kartu text-tinta"
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
                              <Icon name="edit" size={18} />
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
                                onClick={() => setHapusProduk(product)}
                              >
                                <Icon name="trash" size={18} />
                                Hapus
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!loading && products.length === 0 ? (
                    <EmptyState
                      icon="package"
                      title="Belum ada barang"
                      description="Tambah barang pertama supaya pembeli bisa melihat daganganmu."
                    >
                      <button type="button" className={primaryButtonClass} onClick={openCreate}>
                        <Icon name="plus" size={18} />
                        Tambah barang
                      </button>
                    </EmptyState>
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
                            onClick={() => setUbahEtalase(etalase)}
                          >
                            <Icon name="edit" size={18} />
                            Ubah
                          </button>
                          <button
                            type="button"
                            className={dangerButtonClass}
                            disabled={busy}
                            onClick={() => setHapusEtalaseDialog(etalase)}
                          >
                            <Icon name="trash" size={18} />
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                    {etalases.length === 0 ? (
                      <p className="text-base text-tinta-lembut">
                        Belum ada etalase. Buat dulu untuk mengelompokkan barang.
                      </p>
                    ) : null}
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
                        className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
                        onClick={() => {
                          setFormOpen(false);
                          resetForm();
                        }}
                      >
                        <Icon name="close" size={18} />
                        Tutup
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      <Field label="Nama barang" htmlFor="form-name">
                        {(props) => (
                          <input
                            {...props}
                            className={inputClass}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                          />
                        )}
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Kategori" htmlFor="form-category">
                          {(props) => (
                            <select
                              {...props}
                              className={selectClass}
                              value={categoryId}
                              onChange={(event) => setCategoryId(event.target.value)}
                            >
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </Field>
                        <Field label="Etalase" htmlFor="form-etalase">
                          {(props) => (
                            <select
                              {...props}
                              className={selectClass}
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
                          )}
                        </Field>
                      </div>

                      <Field label="Deskripsi" htmlFor="form-description">
                        {(props) => (
                          <textarea
                            {...props}
                            className={`${inputClass} min-h-24 py-3`}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                          />
                        )}
                      </Field>

                      <Field label="Berat (gram)" htmlFor="form-weight">
                        {(props) => (
                          <input
                            {...props}
                            inputMode="numeric"
                            className={inputClass}
                            value={weight}
                            onChange={(event) =>
                              setWeight(event.target.value.replace(/\D/g, ""))
                            }
                          />
                        )}
                      </Field>

                      <div>
                        <label className="mb-2 block text-base font-semibold text-tinta" htmlFor="form-photo">
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
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                              <Icon name="image" size={28} className="text-teal-aksi" />
                              <p className="text-base text-tinta-lembut">Belum ada foto.</p>
                            </div>
                          )}
                          <input
                            id="form-photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={pilihFoto}
                            className={`${fileInputClass} mt-2`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={labelClass}>Pilihan dan stok</p>
                          <button
                            type="button"
                            className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
                            onClick={tambahVariant}
                          >
                            <Icon name="plus" size={18} />
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
                                className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-bahaya transition duration-cepat ease-standar hover:bg-bahaya-muda"
                                onClick={() => void hapusVariant(index)}
                              >
                                <Icon name="trash" size={18} />
                                Hapus pilihan
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {formError ? (
                        <div className={errorBoxClass} role="alert">
                          {formError}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className={`${primaryButtonClass} w-full`}
                        disabled={busy || !name.trim() || variants.length === 0}
                        aria-busy={busy}
                        onClick={() => void simpan()}
                      >
                        {busy ? (
                          <>
                            <Icon name="refresh" size={18} className="animate-memuat" />
                            Menyimpan…
                          </>
                        ) : editingId ? (
                          "Simpan perubahan"
                        ) : (
                          "Simpan barang"
                        )}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={hapusProduk !== null}
        title="Hapus barang dari katalog?"
        description={
          hapusProduk
            ? `“${hapusProduk.name}” akan disembunyikan dari katalog. Stok dan pesanannya tetap aman.`
            : undefined
        }
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        danger
        onConfirm={() => {
          if (hapusProduk) {
            void hapusBarang(hapusProduk);
          }
        }}
        onCancel={() => setHapusProduk(null)}
      />

      <ConfirmDialog
        open={hapusEtalaseDialog !== null}
        title="Hapus etalase?"
        description={
          hapusEtalaseDialog
            ? `Etalase “${hapusEtalaseDialog.name}” akan dihapus. Barang di dalamnya tetap ada.`
            : undefined
        }
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        danger
        onConfirm={() => {
          if (hapusEtalaseDialog) {
            void hapusEtalase(hapusEtalaseDialog);
          }
        }}
        onCancel={() => setHapusEtalaseDialog(null)}
      />

      <PromptDialog
        open={ubahEtalase !== null}
        title="Ubah nama etalase"
        description="Nama baru langsung dipakai di halaman toko."
        label="Nama etalase"
        defaultValue={ubahEtalase?.name ?? ""}
        placeholder="Contoh: Kue Kering"
        confirmLabel="Simpan nama"
        onConfirm={(value) => void simpanUbahEtalase(value)}
        onCancel={() => setUbahEtalase(null)}
      />
    </main>
  );
}
