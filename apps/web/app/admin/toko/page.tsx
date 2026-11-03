"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PRODUCT_STATUS_LABEL,
  SHOP_STATUS_LABEL,
  formatRupiah,
  type AdminProductRow,
  type AdminShopRow,
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
  dangerButtonClass,
  errorBoxClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function AdminShopsPage() {
  const { status, user, request } = useAuth();
  const { notify } = useToast();
  const [shops, setShops] = useState<AdminShopRow[]>([]);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(
    async (search = "") => {
      try {
        const [shopItems, productItems] = await Promise.all([
          request<AdminShopRow[]>("/api/v1/admin/shops"),
          request<AdminProductRow[]>(
            `/api/v1/admin/products${search ? `?q=${encodeURIComponent(search)}` : ""}`,
          ),
        ]);
        setShops(shopItems);
        setProducts(productItems);
        setError(null);
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : "Data belum bisa dimuat.");
      } finally {
        setLoading(false);
      }
    },
    [request],
  );

  useEffect(() => {
    if (status === "masuk" && user?.role === "ADMIN") {
      void load();
    }
  }, [status, user?.role, load]);

  async function ubahToko(shop: AdminShopRow): Promise<void> {
    const next = shop.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setBusy(shop.id);
    try {
      await request(`/api/v1/admin/shops/${shop.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: next,
          note: next === "SUSPENDED" ? "Ditinjau admin." : "Toko aktif kembali.",
        }),
      });
      const pesan = next === "ACTIVE" ? "Toko diaktifkan." : "Toko dinonaktifkan sementara.";
      setMessage(pesan);
      notify(pesan);
      await load(query);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Toko belum bisa diubah.");
    } finally {
      setBusy(null);
    }
  }

  async function ubahBarang(product: AdminProductRow): Promise<void> {
    const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusy(product.id);
    try {
      await request(`/api/v1/admin/products/${product.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      const pesan = next === "ACTIVE" ? "Barang ditampilkan lagi." : "Barang disembunyikan.";
      setMessage(pesan);
      notify(pesan);
      await load(query);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa diubah.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <AppHeader />
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-teal-aksi">Tim Bakul</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Toko & barang</h1>
            <p className="mt-2 text-base text-tinta-lembut">
              Awasi toko dan barang yang tampil di katalog.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className={secondaryButtonClass}>
              Dashboard
            </Link>
            <Link href="/admin/komplain" className={secondaryButtonClass}>
              Komplain
            </Link>
          </div>
        </div>

        {status === "tamu" || (status === "masuk" && user?.role !== "ADMIN") ? (
          <EmptyState
            icon="lock"
            title="Halaman ini hanya untuk admin"
            description="Masuk dengan akun admin untukmoderate toko dan barang."
            action={{ label: "Masuk", href: "/masuk" }}
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

        {loading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-56 w-full rounded-kartu" />
            <Skeleton className="h-56 w-full rounded-kartu" />
          </div>
        ) : null}

        <section className={`${cardClass} mt-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-tinta">Daftar toko</h2>
            <span className="inline-flex min-h-8 items-center rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta-lembut">
              {shops.length} toko
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-kartu border border-garis p-3 transition duration-sedang ease-standar hover:border-garis-kuat"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-tinta">{shop.name}</p>
                  <p className="text-base text-tinta-lembut">
                    {shop.cityName} · {shop.productCount} barang · saldo{" "}
                    {formatRupiah(shop.balanceAvailable)}
                  </p>
                  <p className="text-base text-tinta-lembut">
                    {shop.ownerName} · {shop.ownerPhone}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex min-h-8 items-center rounded-pil px-3 text-base font-semibold ${
                      shop.status === "ACTIVE"
                        ? "bg-mint-muda text-teal-aksi"
                        : "bg-bahaya-muda text-bahaya"
                    }`}
                  >
                    {shop.status === "ACTIVE" ? (
                      <Icon name="check" size={16} />
                    ) : (
                      <Icon name="warning" size={16} />
                    )}
                    {SHOP_STATUS_LABEL[shop.status] ?? shop.status}
                  </span>
                  <button
                    type="button"
                    className={shop.status === "ACTIVE" ? dangerButtonClass : primaryButtonClass}
                    disabled={busy === shop.id}
                    onClick={() => void ubahToko(shop)}
                  >
                    {shop.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            ))}
            {!loading && shops.length === 0 ? (
              <EmptyState
                icon="store"
                title="Belum ada toko"
                description="Toko yang mendaftar akan muncul di sini."
              />
            ) : null}
          </div>
        </section>

        <section className={`${cardClass} mt-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-tinta">Moderasi barang</h2>
            <span className="inline-flex min-h-8 items-center rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta-lembut">
              {products.length} barang
            </span>
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void load(query);
            }}
          >
            <div className="min-w-0 flex-1">
              <Field label="Cari nama barang" htmlFor="admin-search">
                {(props) => (
                  <input
                    {...props}
                    className={inputClass}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama barang"
                  />
                )}
              </Field>
            </div>
            <button type="submit" className={`${primaryButtonClass} mt-7 shrink-0`}>
              <Icon name="search" size={18} />
              Cari
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-kartu border border-garis p-3 transition duration-sedang ease-standar hover:border-garis-kuat"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-tinta">{product.name}</p>
                  <p className="text-base text-tinta-lembut">
                    {product.shopName} · {formatRupiah(product.price)} · stok {product.stock}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-8 items-center rounded-pil bg-abu-kartu px-3 text-base font-semibold text-tinta">
                    {PRODUCT_STATUS_LABEL[product.status] ?? product.status}
                  </span>
                  <button
                    type="button"
                    className={product.status === "ACTIVE" ? dangerButtonClass : primaryButtonClass}
                    disabled={busy === product.id}
                    onClick={() => void ubahBarang(product)}
                  >
                    {product.status === "ACTIVE" ? "Sembunyikan" : "Tampilkan"}
                  </button>
                  <Link href={`/p/${product.slug}`} className={secondaryButtonClass}>
                    Lihat
                  </Link>
                </div>
              </div>
            ))}
            {!loading && products.length === 0 ? (
              <EmptyState
                icon="package"
                title="Barang tidak ditemukan"
                description="Coba kata lain untuk mencari barang yang perlu dimoderasi."
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
