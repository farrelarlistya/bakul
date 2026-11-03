import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  CatalogPage,
  CatalogQuery,
  CategorySummary,
  ProductCard,
  ProductDetail,
  ShopDetail,
} from "@bakul/shared";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const productCardInclude = {
  variants: { select: { price: true, stockAvailable: true } },
  images: { select: { url: true }, orderBy: { position: "asc" } },
  shop: { select: { id: true, name: true, slug: true, cityName: true } },
  category: { select: { id: true, name: true, slug: true } },
  etalase: { select: { name: true } },
} satisfies Prisma.ProductInclude;

const productDetailInclude = {
  ...productCardInclude,
  variants: {
    select: { id: true, sku: true, name: true, price: true, stockAvailable: true },
  },
  reviews: {
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { buyer: { select: { name: true } } },
  },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;
type DetailRow = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

function toCard(product: CardRow): ProductCard {
  const prices = product.variants.map((variant) => variant.price);
  const stock = product.variants.reduce(
    (total, variant) => total + variant.stockAvailable,
    0,
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: prices.length > 0 ? Math.min(...prices) : 0,
    stock,
    rating: Number(product.avgRating),
    soldCount: product.soldCount,
    imageUrl: product.images[0]?.url ?? null,
    city: product.shop.cityName,
    shopName: product.shop.name,
    shopSlug: product.shop.slug,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    etalase: product.etalase?.name ?? null,
  };
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  categories(): Promise<CategorySummary[]> {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    });
  }

  async search(query: CatalogQuery): Promise<CatalogPage> {
    const shopWhere: Prisma.ShopWhereInput = { status: "ACTIVE" };
    if (query.city) {
      shopWhere.cityName = { contains: query.city, mode: "insensitive" };
    }

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      shop: shopWhere,
    };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.rating !== undefined) {
      where.avgRating = { gte: query.rating };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const price: Prisma.IntFilter = {};
      if (query.minPrice !== undefined) {
        price.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        price.lte = query.maxPrice;
      }
      where.variants = { some: { price } };
    }

    const rows = await this.prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: { createdAt: "desc" },
    });

    const cards = rows.map(toCard);

    if (query.sort === "terlaris") {
      cards.sort((a, b) => b.soldCount - a.soldCount || a.name.localeCompare(b.name));
    } else if (query.sort === "harga-asc") {
      cards.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    } else if (query.sort === "harga-desc") {
      cards.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    }

    const total = cards.length;
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    const start = (query.page - 1) * query.limit;
    const products = cards.slice(start, start + query.limit);

    return {
      products,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async productDetail(slug: string): Promise<ProductDetail> {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: "ACTIVE", shop: { status: "ACTIVE" } },
      include: productDetailInclude,
    });

    if (!product) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Barang tidak ditemukan.",
      });
    }

    const card = toCard(product);

    return {
      ...card,
      description: product.description,
      weightGram: product.weightGram,
      images: product.images.map((image) => image.url),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        stockAvailable: variant.stockAvailable,
      })),
      reviewCount: product._count.reviews,
      reviews: product.reviews.map((review) => ({
        id: review.id,
        buyerName: review.buyer.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      })),
      shop: {
        id: product.shop.id,
        name: product.shop.name,
        slug: product.shop.slug,
        cityName: product.shop.cityName,
      },
    };
  }

  async shopDetail(slug: string): Promise<ShopDetail> {
    const shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: "ACTIVE" },
          include: productCardInclude,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shop || shop.status !== "ACTIVE") {
      throw new NotFoundException({
        code: "SHOP_NOT_FOUND",
        message: "Toko tidak ditemukan.",
      });
    }

    const products = shop.products.map(toCard);
    const rating =
      products.length > 0
        ? products.reduce((total, product) => total + product.rating, 0) / products.length
        : 0;

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      cityName: shop.cityName,
      productCount: products.length,
      rating: Number(rating.toFixed(2)),
      products,
    };
  }
}
