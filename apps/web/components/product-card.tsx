import Link from "next/link";
import { formatRupiah, type ProductCard as ProductCardData } from "@bakul/shared";
import { Icon } from "@/components/icon";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group block overflow-hidden rounded-kartu border border-garis bg-abu-kartu transition duration-sedang ease-standar hover:border-garis-kuat hover:bg-putih active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-aksi focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-mint-muda">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-teal-aksi">
            {product.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-10 text-base font-semibold leading-5 text-tinta">
          {product.name}
        </p>
        <p className="mt-1 text-lg font-bold text-tinta">{formatRupiah(product.price)}</p>
        <p className="mt-1 flex items-center gap-1 text-base text-tinta-lembut">
          <Icon name="star" size={14} className="shrink-0 text-perhatian" />
          <span className="sr-only">Rating </span>
          {product.rating.toFixed(1).replace(".", ",")}
          <span aria-hidden="true">·</span>
          <span className="truncate">{product.city}</span>
        </p>
        <p className="mt-1 line-clamp-1 text-base font-semibold text-teal-aksi">
          {product.shopName}
        </p>
      </div>
    </Link>
  );
}
