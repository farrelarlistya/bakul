import { z } from "zod";

export const PRODUCT_SORTS = ["terbaru", "terlaris", "harga-asc", "harga-desc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const catalogQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(100).optional(),
    city: z.string().trim().max(80).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    sort: z.enum(PRODUCT_SORTS).default("terbaru"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  })
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    { message: "Harga minimum tidak boleh lebih besar dari harga maksimum." },
  );

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  rating: number;
  soldCount: number;
  imageUrl: string | null;
  city: string;
  shopName: string;
  shopSlug: string;
  category: CategorySummary;
  etalase: string | null;
};

export type CatalogPage = {
  products: ProductCard[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ReviewItem = {
  id: string;
  buyerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type ProductVariantSummary = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockAvailable: number;
};

export type ProductDetail = ProductCard & {
  description: string;
  weightGram: number;
  images: string[];
  variants: ProductVariantSummary[];
  reviewCount: number;
  reviews: ReviewItem[];
  shop: {
    id: string;
    name: string;
    slug: string;
    cityName: string;
  };
};

export type ShopDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cityName: string;
  productCount: number;
  rating: number;
  products: ProductCard[];
};
