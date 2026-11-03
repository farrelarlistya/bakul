"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah, type CartItemView, type CartView } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { refreshBadges } from "@/lib/badges";
import { useAuth } from "@/lib/auth";

export default function KeranjangPage() {
  const { status, request } = useAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCart(await request<CartView>("/api/v1/cart"));
      refreshBadges();
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Keranjang belum bisa dimuat.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (status === "masuk") {
      void load();
    }
  }, [status, load]);

  async function ubah(item: CartItemView, patch: { quantity?: number; isSelected?: boolean }) {
    setBusyId(item.id);
    try {
      setCart(
        await request<CartView>(`/api/v1/cart/items/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        }),
      );
      refreshBadges();
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Keranjang belum bisa diubah.");
    } finally {
      setBusyId(null);
    }
  }

  async function hapus(item: CartItemView) {
    setBusyId(item.id);
    try {
      setCart(await request<CartView>(`/api/v1/cart/items/${item.id}`, { method: "DELETE" }));
      refreshBadges();
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Barang belum bisa dibuang.");
    } finally {
      setBusyId(null);
    }
  }

  const selectedShops = cart?.shops
    .map((shop) => ({
      ...shop,
      items: shop.items.filter((item) => item.isSelected),
    }))
    .filter((shop) => shop.items.length > 0);

  const selectedSubtotal = selectedShops?.reduce(
    (total, shop) => total + shop.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    0,
  ) ?? 0;
  const selectedCount = selectedShops?.reduce(
    (total, shop) => total + shop.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  ) ?? 0;

  return (
    <main className="min-h-screen bg-putih pb-28 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-base font-semibold text-teal-aksi">Belanja</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Keranjang</h1>

        {status === "memuat" ? <p className="mt-4 text-base text-tinta-lembut">Memeriksa akun…</p> : null}

        {status === "tamu" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Masuk dulu untuk melihat keranjang.</p>
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
            {loading && !cart ? <p className="mt-4 text-base text-tinta-lembut">Memuat keranjang…</p> : null}

            {cart && cart.shops.length === 0 ? (
              <div className={`${cardClass} mt-6 text-center`}>
                <p className="text-lg font-semibold text-tinta">Keranjang masih kosong.</p>
                <p className="mt-1 text-base text-tinta-lembut">
                  Cari barang dari pedagang kecil, lalu tambahkan ke keranjang.
                </p>
                <Link href="/cari" className={`${primaryButtonClass} mt-4`}>
                  Mulai belanja
                </Link>
              </div>
            ) : null}

            {cart?.shops.map((shop) => (
              <section key={shop.shopId} className={`${cardClass} mt-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis pb-3">
                  <Link href={`/toko/${shop.shopSlug}`} className="text-lg font-semibold text-tinta">
                    {shop.shopName}
                  </Link>
                  <p className="text-base text-tinta-lembut">{shop.cityName}</p>
                </div>

                <div className="divide-y divide-garis">
                  {shop.items.map((item) => (
                    <article key={item.id} className="flex gap-3 py-4">
                      <label className="flex min-h-11 min-w-11 items-center justify-center">
                        <input
                          type="checkbox"
                          className="h-6 w-6 shrink-0"
                          checked={item.isSelected}
                          disabled={busyId === item.id}
                          onChange={(event) =>
                            void ubah(item, { isSelected: event.target.checked })
                          }
                          aria-label={`Pilih ${item.productName}`}
                        />
                      </label>

                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-tombol bg-mint-muda">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            width={80}
                            height={80}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/p/${item.productSlug}`}
                          className="line-clamp-2 text-base font-semibold text-tinta"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-base text-tinta-lembut">{item.variantName}</p>
                        <p className="mt-1 text-lg font-bold text-tinta">
                          {formatRupiah(item.price)}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-tombol border border-garis text-xl text-tinta disabled:opacity-50"
                            disabled={busyId === item.id || item.quantity <= 1}
                            onClick={() => void ubah(item, { quantity: item.quantity - 1 })}
                            aria-label="Kurangi jumlah"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-lg font-semibold text-tinta">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-tombol border border-garis text-xl text-tinta disabled:opacity-50"
                            disabled={busyId === item.id || item.quantity >= item.stockAvailable}
                            onClick={() => void ubah(item, { quantity: item.quantity + 1 })}
                            aria-label="Tambah jumlah"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className={`${dangerButtonClass} ml-auto`}
                            disabled={busyId === item.id}
                            onClick={() => void hapus(item)}
                          >
                            Buang
                          </button>
                        </div>
                        <p className="mt-1 text-base text-tinta-lembut">
                          Stok tersedia {item.stockAvailable}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {cart && cart.shops.length > 0 ? (
              <div className="mt-6 rounded-hero border border-garis bg-krem p-4 md:sticky md:bottom-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base text-tinta-lembut">
                      {selectedCount} barang dipilih
                    </p>
                    <p className="text-xl font-bold text-tinta">{formatRupiah(selectedSubtotal)}</p>
                    <p className="text-base text-tinta-lembut">
                      Ongkir dan biaya layanan dihitung di halaman bayar.
                    </p>
                  </div>
                  {selectedCount > 0 ? (
                    <Link href="/bayar" className={primaryButtonClass}>
                      Lanjut bayar
                    </Link>
                  ) : (
                    <span className={secondaryButtonClass}>Pilih barang dulu</span>
                  )}
                </div>
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
