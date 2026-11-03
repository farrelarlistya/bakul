import { Injectable, NotFoundException } from "@nestjs/common";
import type { SellerShopUpdateInput } from "@bakul/shared";
import { StorageService } from "../common/storage/storage.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async myShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerUserId: userId },
      include: {
        _count: { select: { products: true } },
        wallet: true,
      },
    });

    if (!shop) {
      throw new NotFoundException({
        code: "SHOP_NOT_FOUND",
        message: "Kamu belum punya toko.",
      });
    }

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      cityId: shop.cityId,
      cityName: shop.cityName,
      status: shop.status,
      description: shop.description,
      logoUrl: shop.logoUrl,
      productCount: shop._count.products,
      bankName: shop.bankName,
      bankAccountNumber: shop.bankAccountNumber,
      bankAccountHolder: shop.bankAccountHolder,
      supportedCouriers: shop.supportedCouriers,
      balanceAvailable: shop.wallet?.balanceAvailable ?? 0,
    };
  }

  async updateShop(userId: string, input: SellerShopUpdateInput) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    if (!shop) {
      throw new NotFoundException({
        code: "SHOP_NOT_FOUND",
        message: "Kamu belum punya toko.",
      });
    }

    await this.prisma.shop.update({
      where: { id: shop.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.bankName !== undefined ? { bankName: input.bankName } : {}),
        ...(input.bankAccountNumber !== undefined
          ? { bankAccountNumber: input.bankAccountNumber }
          : {}),
        ...(input.bankAccountHolder !== undefined
          ? { bankAccountHolder: input.bankAccountHolder }
          : {}),
        ...(input.supportedCouriers !== undefined
          ? { supportedCouriers: input.supportedCouriers }
          : {}),
      },
    });

    return this.myShop(userId);
  }

  async setLogo(userId: string, file: Express.Multer.File | undefined) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerUserId: userId },
      select: { id: true, logoUrl: true },
    });
    if (!shop) {
      throw new NotFoundException({
        code: "SHOP_NOT_FOUND",
        message: "Kamu belum punya toko.",
      });
    }

    const url = await this.storage.saveShopLogo(file);
    if (!url) {
      throw new NotFoundException({
        code: "LOGO_REQUIRED",
        message: "Pilih foto logo dulu.",
      });
    }

    await this.prisma.shop.update({
      where: { id: shop.id },
      data: { logoUrl: url },
    });
    await this.storage.deleteByUrl(shop.logoUrl);

    return this.myShop(userId);
  }
}
