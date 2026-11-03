"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRupiah, type ProductDetail } from "@bakul/shared";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import { errorBoxClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { refreshBadges } from "@/lib/badges";
import { useAuth } from "@/lib/auth";

function tanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ProductDetailClient({ slug }: { slug: string }) {
  const { status, request } = useAuth();
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    void fetch(`/api/v1/products/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const message =
            body && typeof body === "object" && "error" in body
              ? String((body as { error?: { message?: string } }).error?.message)
              : "Barang belum bisa dimuat.";
          throw new Error(message);
        }
        return (await response.json()) as ProductDetail;
      })
      .then((product) => {
        setDetail(product);
        setSelectedVariantId(product.variants[0]?.id ?? null);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(caught instanceof Error ? caught.message : "Barang belum bisa dimuat.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  const variant =
    detail?.variants.find((item) => item.id === selectedVariantId) ?? detail?.variants[0];
  const stock = variant?.stockAvailable ?? detail?.stock ?? 0;
  const price = variant?.price ?? detail?.price ?? 0;
  const image = detail?.images[activeImage] ?? detail?.imageUrl ?? null;

  async function tambahKeKeranjang(): Promise<void> {
    if (!variant) {
      return;
    }
    if (status !== "masuk") {
      window.location.href = "/masuk";
      return;
    }

    setCartBusy(true);
    setCartMessage(null);
    try {
      await request("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId: variant.id, quantity }),
      });
      setCartMessage(`${quantity} ${detail?.name ?? "barang"} masuk keranjang.`);
      refreshBadges();
    } catch (caught: unknown) {
      setCartMessage(caught instanceof Error ? caught.message : "Belum bisa masuk keranjang.");
    } finally {
      setCartBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-putih pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link
          href="/cari"
          className="inline-flex min-h-11 items-center text-base font-semibold text-teal-aksi"
        >
          ← Kembali ke pencarian
        </Link>

        {loading ? <p className="mt-4 text-base text-tinta-lembut">Memuat barang…</p> : null}
        {error ? (
          <div className={`${errorBoxClass} mt-4`} role="alert">
            {error}
          </div>
        ) : null}

        {detail ? (
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div>
              <div className="aspect-square overflow-hidden rounded-hero bg-mint-muda">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={detail.name}
                    width={800}
                    height={800}
                    loading="eager"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl font-bold text-teal-aksi">
                    {detail.name.slice(0, 1)}
                  </div>
                )}
              </div>

              {detail.images.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {detail.images.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-pressed={index === activeImage}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-tombol border-2 ${
                        index === activeImage ? "border-teal-aksi" : "border-garis"
                      }`}
                      aria-label={`Foto ke-${index + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        width={80}
                        height={80}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <p className="text-base text-tinta-lembut">
                {detail.category.name}
                {detail.etalase ? ` · ${detail.etalase}` : ""}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold text-tinta">
                {detail.name}
              </h1>
              <p className="mt-3 text-3xl font-bold text-tinta">{formatRupiah(price)}</p>
              <p className="mt-2 text-base text-tinta-lembut">
                ★ {detail.rating.toFixed(1).replace(".", ",")} · {detail.soldCount} terjual ·{" "}
                {detail.city}
              </p>
              <p className="mt-1 text-base text-tinta-lembut">
                Berat {detail.weightGram} gram · Stok {stock}
              </p>

              {detail.variants.length > 1 ? (
                <div className="mt-5">
                  <p className="text-base font-semibold text-tinta">Pilihan</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detail.variants.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(item.id);
                          setQuantity(1);
                        }}
                        aria-pressed={item.id === variant?.id}
                        className={`min-h-11 rounded-tombol border px-4 text-base font-semibold ${
                          item.id === variant?.id
                            ? "border-teal-aksi bg-mint-muda text-teal-aksi"
                            : "border-garis bg-putih text-tinta"
                        }`}
                      >
                        {item.name} · {formatRupiah(item.price)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <p className="text-base font-semibold text-tinta">Jumlah</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-tombol border border-garis text-xl text-tinta disabled:opacity-50"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    disabled={quantity <= 1}
                    aria-label="Kurangi jumlah"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-lg font-semibold text-tinta">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-tombol border border-garis text-xl text-tinta disabled:opacity-50"
                    onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
                    disabled={quantity >= stock}
                    aria-label="Tambah jumlah"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={`${primaryButtonClass} mt-6 w-full`}
                disabled={stock <= 0 || cartBusy}
                aria-busy={cartBusy}
                onClick={() => void tambahKeKeranjang()}
              >
                {stock <= 0 ? "Stok habis" : cartBusy ? "Memasukkan…" : "Tambah ke keranjang"}
              </button>
              {cartMessage ? (
                <p className="mt-2 rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi" role="status">
                  {cartMessage}{" "}
                  <Link href="/keranjang" className="font-semibold underline">
                    Lihat keranjang
                  </Link>
                </p>
              ) : (
                <p className="mt-2 text-base text-tinta-lembut">
                  Uang ditahan aman sampai barang diterima.
                </p>
              )}

              <Link
                href={`/toko/${detail.shop.slug}`}
                className="mt-5 flex min-h-16 items-center gap-3 rounded-kartu border border-garis bg-putih p-3"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-pil bg-mint-muda text-base font-bold text-teal-aksi">
                  {detail.shop.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={detail.shop.logoUrl}
                      alt={`Logo ${detail.shop.name}`}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    detail.shop.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold text-tinta">
                    {detail.shop.name}
                  </span>
                  <span className="block text-base text-tinta-lembut">
                    {detail.shop.cityName}
                  </span>
                </span>
                <span className="text-base font-semibold text-teal-aksi">Lihat toko</span>
              </Link>
            </div>
          </div>
        ) : null}

        {detail ? (
          <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-kartu border border-garis bg-putih p-5">
              <h2 className="font-display text-2xl font-bold text-tinta">Deskripsi</h2>
              <p className="mt-2 whitespace-pre-line text-base leading-7 text-tinta">
                {detail.description}
              </p>
            </section>

            <section className="rounded-kartu border border-garis bg-putih p-5">
              <h2 className="font-display text-2xl font-bold text-tinta">
                Ulasan ({detail.reviewCount})
              </h2>
              {detail.reviews.length === 0 ? (
                <p className="mt-2 text-base text-tinta-lembut">Belum ada ulasan.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {detail.reviews.map((review) => (
                    <li key={review.id} className="border-b border-garis pb-3 last:border-0">
                      <p className="text-base font-semibold text-tinta">
                        {review.buyerName}
                      </p>
                      <p className="text-base text-perhatian">
                        <span aria-hidden="true">{"★".repeat(review.rating)}</span>
                        <span className="sr-only">{review.rating} bintang</span>
                      </p>
                      {review.comment ? (
                        <p className="mt-1 text-base text-tinta">{review.comment}</p>
                      ) : null}
                      {review.mediaUrls.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {review.mediaUrls.map((url) => (
                            <li key={url} className="h-16 w-16 overflow-hidden rounded-tombol border border-garis">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="Foto ulasan" width={64} height={64} className="h-full w-full object-cover" />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p className="mt-1 text-base text-tinta-lembut">
                        {tanggal(review.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <SiteFooter />
      <BottomNav />
    </main>
  );
}
