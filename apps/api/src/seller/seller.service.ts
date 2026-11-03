import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async myShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerUserId: userId },
      include: {
        _count: { select: { products: true } },
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
      productCount: shop._count.products,
    };
  }
}
