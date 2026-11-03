import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { FirstProductInput, ShopOnboardingInput } from "@bakul/shared";
import { randomBytes } from "node:crypto";
import { StorageService } from "../common/storage/storage.service";
import { PrismaService } from "../prisma/prisma.service";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createShop(userId: string, input: ShopOnboardingInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Akun tidak ditemukan.",
      });
    }

    if (user.shop) {
      throw new ConflictException({
        code: "SHOP_ALREADY_EXISTS",
        message: "Kamu sudah punya toko.",
      });
    }

    if (user.role === "ADMIN" || user.role === "OPERATOR_DEMO") {
      throw new ForbiddenException({
        code: "ROLE_CANNOT_SELL",
        message: "Akun ini tidak bisa membuka toko.",
      });
    }

    const slug = await this.uniqueShopSlug(input.name);

    const shop = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.shop.create({
        data: {
          ownerUserId: userId,
          name: input.name,
          slug,
          description: input.description ?? null,
          status: "ACTIVE",
          cityId: input.cityId,
          cityName: input.cityName,
          supportedCouriers: ["JNE", "SICEPAT"],
        },
      });

      await transaction.user.update({
        where: { id: userId },
        data: { role: "SELLER" },
      });

      return created;
    });

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      cityName: shop.cityName,
      status: shop.status,
    };
  }

  async createFirstProduct(
    userId: string,
    input: FirstProductInput,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true },
    });

    if (!user?.shop) {
      throw new ForbiddenException({
        code: "SHOP_REQUIRED",
        message: "Buka toko dulu sebelum menambah barang.",
      });
    }

    const productCount = await this.prisma.product.count({
      where: { shopId: user.shop.id },
    });

    if (productCount > 0) {
      throw new ConflictException({
        code: "FIRST_PRODUCT_ALREADY_EXISTS",
        message: "Kamu sudah punya barang. Tambah barang lain menyusul di tahap katalog.",
      });
    }

    const category = input.categoryId
      ? await this.prisma.category.findUnique({ where: { id: input.categoryId } })
      : await this.prisma.category.findFirst({
          where: { slug: "makanan-ringan" },
          orderBy: { sortOrder: "asc" },
        });

    if (!category) {
      throw new NotFoundException({
        code: "CATEGORY_NOT_FOUND",
        message: "Kategori belum tersedia.",
      });
    }

    const slug = await this.uniqueProductSlug(input.name);
    const etalase = await this.prisma.shopEtalase.findFirst({
      where: { shopId: user.shop.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    const photoUrl = await this.storage.saveProductPhoto(file);

    try {
      const product = await this.prisma.product.create({
        data: {
          shopId: user.shop.id,
          categoryId: category.id,
          etalaseId: etalase?.id ?? null,
          name: input.name,
          slug,
          description:
            input.description ??
            `${input.name} buatan ${user.shop.name} di ${user.shop.cityName}.`,
          weightGram: input.weightGram ?? 250,
          status: "ACTIVE",
          variants: {
            create: {
              sku: `BKL-${randomBytes(3).toString("hex").toUpperCase()}-1`,
              name: "Standar",
              price: input.price,
              stockAvailable: 10,
              stockReserved: 0,
            },
          },
          ...(photoUrl
            ? {
                images: {
                  create: { url: photoUrl, position: 0 },
                },
              }
            : {}),
        },
        include: {
          variants: true,
          images: true,
          category: true,
        },
      });

      const variant = product.variants[0];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: variant?.price ?? input.price,
        stock: variant?.stockAvailable ?? 10,
        category: product.category.name,
        imageUrl: product.images[0]?.url ?? null,
        shop: {
          id: user.shop.id,
          name: user.shop.name,
          slug: user.shop.slug,
        },
      };
    } catch (error) {
      await this.storage.deleteByUrl(photoUrl);
      throw error;
    }
  }

  private async uniqueShopSlug(name: string): Promise<string> {
    const base = slugify(name) || "toko";
    let slug = base;
    let counter = 2;

    while (await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  private async uniqueProductSlug(name: string): Promise<string> {
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
}
