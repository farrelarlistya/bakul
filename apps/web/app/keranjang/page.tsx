"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah, type CartItemView, type CartView } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { QuantityStepper } from "@/components/quantity-stepper";
import { SiteFooter } from "@/components/site-footer";
import { SkeletonRow } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
import {
  cardClass,
  errorBoxClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { refreshBadges } from "@/lib/badges";
import { useAuth } from "@/lib/auth";

export default function KeranjangPage() {
  const { status, request } = useAuth();
  const { notify } = useToast();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hapusItem, setHapusItem] = useState<CartItemView | null>(null);

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
      notify(`${item.productName} dibuang dari keranjang.`);
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
  const totalCount =
    cart?.shops.reduce(
      (total, shop) => total + shop.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    ) ?? 0;

  return (
    <main className="min-h-screen bg-putih pb-28 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <p className="text-base font-semibold text-teal-aksi">Belanja</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-tinta">Keranjang</h1>

        {status === "memuat" ? (
          <p className="mt-4 text-base text-tinta-lembut">Memeriksa akun…</p>
        ) : null}

        {status === "tamu" ? (
          <EmptyState
            icon="user"
            title="Masuk dulu untuk melihat keranjang"
            description="Masuk dengan nomor HP, lalu keranjangmu akan muncul di sini."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {status === "masuk" ? (
          <>
            {error ? (
              <div className={`${errorBoxClass} mt-4`} role="alert">
                {error}
              </div>
            ) : null}
            {loading && !cart ? (
              <div className="mt-4 space-y-3">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : null}

            {cart && cart.shops.length === 0 ? (
              <EmptyState
                icon="bag"
                title="Keranjang masih kosong"
                description="Cari barang dari pedagang kecil, lalu tambahkan ke keranjang."
                action={{ label: "Mulai belanja", href: "/cari" }}
                className="mt-6"
              />
            ) : null}

            {cart?.shops.map((shop) => (
              <section key={shop.shopId} className={`${cardClass} mt-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis pb-3">
                  <Link
                    href={`/toko/${shop.shopSlug}`}
                    className="inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-lg font-semibold text-tinta transition duration-cepat ease-standar hover:text-teal-aksi"
                  >
                    <Icon name="store" size={18} className="text-tinta-lembut" />
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
                          className="h-6 w-6 shrink-0 accent-teal-aksi"
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
                          className="line-clamp-2 text-base font-semibold text-tinta transition duration-cepat ease-standar hover:text-teal-aksi"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-base text-tinta-lembut">{item.variantName}</p>
                        <p className="mt-1 text-lg font-bold text-tinta">
                          {formatRupiah(item.price)}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <QuantityStepper
                            value={item.quantity}
                            min={1}
                            max={item.stockAvailable}
                            disabled={busyId === item.id}
                            onChange={(value) => void ubah(item, { quantity: value })}
                            label={`Jumlah ${item.productName}`}
                          />
                          <button
                            type="button"
                            className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-tombol px-2 text-base font-semibold text-bahaya transition duration-cepat ease-standar hover:bg-bahaya-muda active:scale-[0.98] disabled:cursor-not-allowed disabled:text-tinta-lembut"
                            disabled={busyId === item.id}
                            onClick={() => setHapusItem(item)}
                          >
                            <Icon name="trash" size={18} />
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
              <div className="mt-6 rounded-hero border border-garis-kuat bg-krem p-4 md:sticky md:bottom-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base text-tinta-lembut" aria-live="polite">
                      {selectedCount} dari {totalCount} barang dipilih
                    </p>
                    <p className="text-xl font-bold text-tinta">{formatRupiah(selectedSubtotal)}</p>
                    <p className="text-base text-tinta-lembut">
                      Ongkir dan biaya layanan dihitung di halaman bayar.
                    </p>
                  </div>
                  {selectedCount > 0 ? (
                    <Link href="/bayar" className={primaryButtonClass}>
                      Lanjut bayar
                      <Icon name="arrowRight" size={18} />
                    </Link>
                  ) : (
                    <span className={secondaryButtonClass}>Pilih barang dulu</span>
                  )}
                </div>

                {totalCount > 0 ? (
                  <div
                    className="mt-3 h-2 w-full overflow-hidden rounded-pil bg-putih"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={totalCount}
                    aria-valuenow={selectedCount}
                    aria-label="Barang yang dipilih"
                  >
                    <div
                      className="h-full rounded-pil bg-teal-aksi transition-[width] duration-sedang ease-standar"
                      style={{ width: `${Math.round((selectedCount / totalCount) * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />

      <ConfirmDialog
        open={hapusItem !== null}
        title="Buang barang ini?"
        description={
          hapusItem
            ? `${hapusItem.productName} akan dihapus dari keranjang. Stoknya kembali ke toko.`
            : undefined
        }
        confirmLabel="Ya, buang"
        cancelLabel="Batal"
        danger
        onConfirm={() => {
          if (hapusItem) {
            void hapus(hapusItem);
          }
          setHapusItem(null);
        }}
        onCancel={() => setHapusItem(null)}
      />
    </main>
  );
}
