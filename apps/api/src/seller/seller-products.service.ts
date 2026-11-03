import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  slugify,
  type EtalaseInput,
  type ProductInput,
  type VariantInput,
  type ProductStatusValue,
  type ProductUpdateInput,
  type VariantUpdateInput,
} from "@bakul/shared";
import { randomBytes } from "node:crypto";
import { StorageService } from "../common/storage/storage.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SellerProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(userId: string) {
    const shop = await this.shopFor(userId);
    const products = await this.prisma.product.findMany({
      where: { shopId: shop.id },
      include: {
        variants: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { position: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        etalase: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => this.toSellerProduct(product));
  }

  async create(userId: string, input: ProductInput) {
    const shop = await this.shopFor(userId);
    const category = await this.prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException({
        code: "CATEGORY_NOT_FOUND",
        message: "Kategori belum tersedia.",
      });
    }

    if (input.etalaseId) {
      await this.ensureEtalase(shop.id, input.etalaseId);
    }

    const slug = await this.uniqueSlug(input.name);
    const product = await this.prisma.product.create({
      data: {
        shopId: shop.id,
        categoryId: input.categoryId,
        etalaseId: input.etalaseId ?? null,
        name: input.name,
        slug,
        description: input.description ?? `${input.name} dari ${shop.name}.`,
        weightGram: input.weightGram,
        status: "ACTIVE",
        variants: {
          create: input.variants.map((variant, index) => ({
            sku: this.sku(index),
            name: variant.name,
            price: variant.price,
            stockAvailable: variant.stockAvailable,
            stockReserved: 0,
          })),
        },
      },
      include: {
        variants: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { position: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        etalase: { select: { id: true, name: true } },
      },
    });

    return this.toSellerProduct(product);
  }

  async update(userId: string, productId: string, input: ProductUpdateInput) {
    const product = await this.ownedProduct(userId, productId);

    if (input.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException({
          code: "CATEGORY_NOT_FOUND",
          message: "Kategori belum tersedia.",
        });
      }
    }

    if (input.etalaseId) {
      await this.ensureEtalase(product.shopId, input.etalaseId);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.etalaseId !== undefined ? { etalaseId: input.etalaseId } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.weightGram !== undefined ? { weightGram: input.weightGram } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    return this.getOwned(userId, productId);
  }

  async addVariant(userId: string, productId: string, input: VariantInput) {
    await this.ownedProduct(userId, productId);
    const count = await this.prisma.productVariant.count({ where: { productId } });

    if (count >= 5) {
      throw new BadRequestException({
        code: "VARIANT_LIMIT",
        message: "Maksimal 5 pilihan per barang.",
      });
    }

    await this.prisma.productVariant.create({
      data: {
        productId,
        sku: this.sku(count),
        name: input.name,
        price: input.price,
        stockAvailable: input.stockAvailable,
        stockReserved: 0,
      },
    });

    return this.getOwned(userId, productId);
  }

  async removeVariant(userId: string, productId: string, variantId: string) {
    await this.ownedProduct(userId, productId);
    const count = await this.prisma.productVariant.count({ where: { productId } });

    if (count <= 1) {
      throw new BadRequestException({
        code: "VARIANT_LAST",
        message: "Barang harus punya minimal satu pilihan.",
      });
    }

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      select: { id: true },
    });

    if (!variant) {
      throw new NotFoundException({
        code: "VARIANT_NOT_FOUND",
        message: "Pilihan barang tidak ditemukan.",
      });
    }

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return this.getOwned(userId, productId);
  }

  async updateVariant(
    userId: string,
    productId: string,
    variantId: string,
    input: VariantUpdateInput,
  ) {
    await this.ownedProduct(userId, productId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      select: { id: true },
    });

    if (!variant) {
      throw new NotFoundException({
        code: "VARIANT_NOT_FOUND",
        message: "Pilihan barang tidak ditemukan.",
      });
    }

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.stockAvailable !== undefined
          ? { stockAvailable: input.stockAvailable }
          : {}),
      },
    });

    return this.getOwned(userId, productId);
  }

  async setStatus(userId: string, productId: string, status: ProductStatusValue) {
    await this.ownedProduct(userId, productId);
    await this.prisma.product.update({
      where: { id: productId },
      data: { status },
    });
    return this.getOwned(userId, productId);
  }

  async addImage(userId: string, productId: string, file?: Express.Multer.File) {
    await this.ownedProduct(userId, productId);
    const count = await this.prisma.productImage.count({ where: { productId } });

    if (count >= 5) {
      throw new BadRequestException({
        code: "IMAGE_LIMIT",
        message: "Maksimal 5 foto per barang.",
      });
    }

    const url = await this.storage.saveProductPhoto(file);
    if (!url) {
      throw new BadRequestException({
        code: "PHOTO_REQUIRED",
        message: "Pilih foto yang mau diunggah.",
      });
    }

    const last = await this.prisma.productImage.findFirst({
      where: { productId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    await this.prisma.productImage.create({
      data: { productId, url, position: (last?.position ?? -1) + 1 },
    });

    return { url };
  }

  async listEtalases(userId: string) {
    const shop = await this.shopFor(userId);
    return this.prisma.shopEtalase.findMany({
      where: { shopId: shop.id },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async createEtalase(userId: string, input: EtalaseInput) {
    const shop = await this.shopFor(userId);
    const slug = await this.uniqueEtalaseSlug(shop.id, input.name);
    const last = await this.prisma.shopEtalase.findFirst({
      where: { shopId: shop.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return this.prisma.shopEtalase.create({
      data: {
        shopId: shop.id,
        name: input.name,
        slug,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateEtalase(userId: string, etalaseId: string, input: EtalaseInput) {
    const shop = await this.shopFor(userId);
    const etalase = await this.prisma.shopEtalase.findFirst({
      where: { id: etalaseId, shopId: shop.id },
    });

    if (!etalase) {
      throw new NotFoundException({
        code: "ETALASE_NOT_FOUND",
        message: "Etalase tidak ditemukan.",
      });
    }

    const slug = await this.uniqueEtalaseSlug(shop.id, input.name, etalase.id);

    return this.prisma.shopEtalase.update({
      where: { id: etalase.id },
      data: { name: input.name, slug },
    });
  }

  async deleteEtalase(userId: string, etalaseId: string): Promise<{ ok: true }> {
    const shop = await this.shopFor(userId);
    const etalase = await this.prisma.shopEtalase.findFirst({
      where: { id: etalaseId, shopId: shop.id },
      select: { id: true },
    });

    if (!etalase) {
      throw new NotFoundException({
        code: "ETALASE_NOT_FOUND",
        message: "Etalase tidak ditemukan.",
      });
    }

    await this.prisma.shopEtalase.delete({ where: { id: etalase.id } });
    return { ok: true };
  }

  private async getOwned(userId: string, productId: string) {
    await this.ownedProduct(userId, productId);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { position: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        etalase: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Barang tidak ditemukan.",
      });
    }

    return this.toSellerProduct(product);
  }

  private async ownedProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, shop: { ownerUserId: userId } },
      select: { id: true, shopId: true },
    });

    if (!product) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Barang tidak ditemukan.",
      });
    }

    return product;
  }

  private async shopFor(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerUserId: userId },
      select: { id: true, name: true },
    });

    if (!shop) {
      throw new ForbiddenException({
        code: "SHOP_REQUIRED",
        message: "Buka toko dulu sebelum mengelola barang.",
      });
    }

    return shop;
  }

  private async ensureEtalase(shopId: string, etalaseId: string) {
    const etalase = await this.prisma.shopEtalase.findFirst({
      where: { id: etalaseId, shopId },
      select: { id: true },
    });

    if (!etalase) {
      throw new BadRequestException({
        code: "ETALASE_NOT_FOUND",
        message: "Etalase tidak ditemukan di tokomu.",
      });
    }
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || "barang";
    let slug = base;
    let counter = 2;

    while (
      await this.prisma.product.findUnique({ where: { slug }, select: { id: true } })
    ) {
      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private async uniqueEtalaseSlug(
    shopId: string,
    name: string,
    exceptId?: string,
  ): Promise<string> {
    const base = slugify(name) || "etalase";
    let slug = base;
    let counter = 2;

    while (
      await this.prisma.shopEtalase.findFirst({
        where: { shopId, slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
        select: { id: true },
      })
    ) {
      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private sku(index: number): string {
    return `BKL-${randomBytes(3).toString("hex").toUpperCase()}-${index + 1}`;
  }

  private toSellerProduct(product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: string;
    weightGram: number;
    avgRating: unknown;
    soldCount: number;
    category: { id: string; name: string; slug: string };
    etalase: { id: string; name: string } | null;
    variants: {
      id: string;
      sku: string;
      name: string;
      price: number;
      stockAvailable: number;
      stockReserved: number;
    }[];
    images: { id: string; url: string; position: number }[];
  }) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      status: product.status,
      weightGram: product.weightGram,
      rating: Number(product.avgRating),
      soldCount: product.soldCount,
      category: product.category,
      etalase: product.etalase,
      price:
        product.variants.length > 0
          ? Math.min(...product.variants.map((variant) => variant.price))
          : 0,
      stock: product.variants.reduce(
        (total, variant) => total + variant.stockAvailable,
        0,
      ),
      variants: product.variants,
      images: product.images,
    };
  }
}
