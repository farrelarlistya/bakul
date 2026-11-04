import Link from "next/link";
import { Icon } from "@/components/icon";

export type HomeShop = {
  slug: string;
  name: string;
  city: string;
  imageUrl: string | null;
};

export function HomeShopCard({ shop }: { shop: HomeShop }) {
  return (
    <Link
      href={`/toko/${shop.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-kartu-besar border border-transparent bg-putih transition duration-cepat ease-standar hover:border-hutan/30 active:scale-[0.99] focus-visible:outline-hutan"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-krem-terang">
        {shop.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.imageUrl}
            alt={`Barang dari ${shop.name}`}
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-hutan">
            {shop.name.slice(0, 1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 min-h-10 text-base font-semibold leading-5 text-tinta">
          {shop.name}
        </p>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-base text-tinta-lembut">
          <Icon name="pin" size={14} className="shrink-0" />
          <span className="truncate">{shop.city}</span>
        </p>

        <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-base font-semibold text-hutan">
          Lihat toko
          <Icon name="arrowRight" size={16} />
        </span>
      </div>
    </Link>
  );
}
