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
import { SiteHeader } from "@/components/site-header";
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
  const [shops, setShops] = useState<AdminShopRow[]>([]);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
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
      setMessage(next === "ACTIVE" ? "Toko diaktifkan." : "Toko dinonaktifkan sementara.");
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
      setMessage(next === "ACTIVE" ? "Barang ditampilkan lagi." : "Barang disembunyikan.");
      await load(query);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa diubah.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-krem pb-10">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
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
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Halaman ini hanya untuk admin.</p>
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

        <section className={`${cardClass} mt-5`}>
          <h2 className="font-display text-2xl font-bold text-tinta">Daftar toko</h2>
          <div className="mt-3 space-y-2">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-kartu border border-garis p-3"
              >
                <div>
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
                    className={`rounded-pil px-3 py-1 text-base font-semibold ${
                      shop.status === "ACTIVE"
                        ? "bg-mint text-teal-aksi"
                        : "bg-[#fbeae8] text-bahaya"
                    }`}
                  >
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
          </div>
        </section>

        <section className={`${cardClass} mt-5`}>
          <h2 className="font-display text-2xl font-bold text-tinta">Moderasi barang</h2>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void load(query);
            }}
          >
            <input
              className={inputClass}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama barang"
              aria-label="Cari nama barang"
            />
            <button type="submit" className={primaryButtonClass}>
              Cari
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-kartu border border-garis p-3"
              >
                <div>
                  <p className="text-base font-semibold text-tinta">{product.name}</p>
                  <p className="text-base text-tinta-lembut">
                    {product.shopName} · {formatRupiah(product.price)} · stok {product.stock}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-pil bg-abu-kartu px-3 py-1 text-base text-tinta">
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
          </div>
        </section>
      </div>
    </main>
  );
}
