import Link from "next/link";
import { formatRupiah, type ProductCard as ProductCardData } from "@bakul/shared";
import { Icon } from "@/components/icon";

export function HomeProductCard({ product }: { product: ProductCardData }) {
  const stokHabis = product.stock <= 0;
  const stokTipis = !stokHabis && product.stock <= 5;

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group block overflow-hidden rounded-kartu border border-garis bg-putih transition-colors hover:border-teal-aksi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-aksi focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-mint-muda">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={240}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-teal-aksi">
            {product.name.slice(0, 1)}
          </div>
        )}

        {stokHabis ? (
          <span className="absolute left-2 top-2 inline-flex min-h-7 items-center rounded-tombol bg-[#fbeae8] px-2 text-sm font-semibold text-bahaya">
            Stok habis
          </span>
        ) : stokTipis ? (
          <span className="absolute left-2 top-2 inline-flex min-h-8 items-center rounded-tombol bg-krem px-2 text-base font-semibold text-perhatian-tua">
            Tersisa {product.stock}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <p className="line-clamp-2 min-h-10 text-base font-semibold leading-5 text-tinta">
          {product.name}
        </p>
        <p className="mt-1 text-lg font-bold text-tinta">{formatRupiah(product.price)}</p>

        <div className="mt-1 flex min-w-0 items-center gap-1 text-base text-tinta-lembut">
          <Icon name="star" size={14} className="shrink-0 text-perhatian" />
          <span className="shrink-0">{product.rating.toFixed(1).replace(".", ",")}</span>
          <span className="shrink-0">·</span>
          <span className="truncate">{product.city}</span>
        </div>

        <p className="mt-1 line-clamp-1 text-base font-semibold text-teal-aksi">
          {product.shopName}
        </p>
      </div>
    </Link>
  );
}
