import Link from "next/link";
import { formatRupiah, type ProductCard as ProductCardData } from "@bakul/shared";
import { Icon } from "@/components/icon";

export function HomeProductCard({ product }: { product: ProductCardData }) {
  const stokHabis = product.stock <= 0;
  const stokTipis = !stokHabis && product.stock <= 5;
  const adaUlasan = product.rating > 0;

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-kartu-besar border border-transparent bg-putih transition duration-cepat ease-standar hover:border-kuning active:scale-[0.99] focus-visible:outline-kuning"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-krem-terang">
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
          <div className="flex h-full items-center justify-center text-4xl font-bold text-hutan">
            {product.name.slice(0, 1)}
          </div>
        )}

        {adaUlasan ? (
          <span className="absolute left-2 top-2 inline-flex min-h-8 items-center gap-1 rounded-pil bg-putih px-2 text-base font-semibold text-tinta">
            <Icon name="star" size={14} className="shrink-0 text-perhatian" />
            {product.rating.toFixed(1).replace(".", ",")}
          </span>
        ) : null}

        {stokHabis ? (
          <span className="absolute right-2 top-2 inline-flex min-h-8 items-center rounded-pil bg-bahaya-muda px-2 text-base font-semibold text-bahaya">
            Stok habis
          </span>
        ) : stokTipis ? (
          <span className="absolute right-2 top-2 inline-flex min-h-8 items-center rounded-pil bg-kuning px-2 text-base font-semibold text-tinta">
            Tersisa {product.stock}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 min-h-10 text-base font-semibold leading-5 text-tinta">
          {product.name}
        </p>
        <p className="mt-1 text-lg font-bold text-tinta">
          {formatRupiah(product.price)}
        </p>

        <div className="mt-1 flex min-w-0 items-center gap-1 text-base text-tinta-lembut">
          <Icon name="pin" size={14} className="shrink-0" />
          <span className="truncate">{product.city}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-base font-semibold text-hutan">
          {product.shopName}
        </p>

        <div className="mt-auto pt-3">
          <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-pil border border-hutan/30 px-3 text-base font-semibold text-hutan transition duration-cepat ease-standar group-hover:border-hutan group-hover:bg-hutan group-hover:text-putih">
            Lihat barang
            <Icon name="arrowRight" size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
