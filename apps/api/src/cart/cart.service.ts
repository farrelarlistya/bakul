import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AddCartItemInput, CartItemView, CartShopGroup, CartView, UpdateCartItemInput } from "@bakul/shared";
import { PrismaService } from "../prisma/prisma.service";

const cartInclude = {
  variant: {
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" as const }, take: 1 },
          shop: { select: { id: true, name: true, slug: true, cityName: true, supportedCouriers: true } },
        },
      },
    },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async view(userId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: cartInclude,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      return { shops: [], totalItems: 0, subtotal: 0 };
    }

    const items = cart.items.filter(
      (item) =>
        item.variant.product.status === "ACTIVE" &&
        item.variant.product.shop !== null,
    );

    const groups = new Map<string, CartShopGroup>();

    for (const item of items) {
      const product = item.variant.product;
      const shop = product.shop;
      const group = groups.get(shop.id) ?? {
        shopId: shop.id,
        shopName: shop.name,
        shopSlug: shop.slug,
        cityName: shop.cityName,
        supportedCouriers: shop.supportedCouriers,
        items: [],
        subtotal: 0,
        totalItems: 0,
      };

      const itemView: CartItemView = {
        id: item.id,
        variantId: item.variantId,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantName: item.variant.name,
        shopId: shop.id,
        shopName: shop.name,
        price: item.variant.price,
        quantity: item.quantity,
        stockAvailable: item.variant.stockAvailable,
        weightGram: product.weightGram,
        imageUrl: product.images[0]?.url ?? null,
        isSelected: item.isSelected,
      };

      group.items.push(itemView);
      group.subtotal += itemView.price * itemView.quantity;
      group.totalItems += itemView.quantity;
      groups.set(shop.id, group);
    }

    const shops = [...groups.values()];
    return {
      shops,
      totalItems: shops.reduce((total, shop) => total + shop.totalItems, 0),
      subtotal: shops.reduce((total, shop) => total + shop.subtotal, 0),
    };
  }

  async add(userId: string, input: AddCartItemInput): Promise<CartView> {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: input.variantId,
        product: { status: "ACTIVE", shop: { status: "ACTIVE" } },
      },
      select: {
        id: true,
        stockAvailable: true,
        product: { select: { name: true } },
      },
    });

    if (!variant) {
      throw new NotFoundException({
        code: "VARIANT_NOT_FOUND",
        message: "Barang ini sudah tidak dijual. Cari barang lain, ya.",
      });
    }

    if (variant.stockAvailable < 1) {
      throw new BadRequestException({
        code: "STOCK_EMPTY",
        message: "Stok barang ini habis. Pilih barang lain.",
      });
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: true },
    });

    const existing = cart.items.find((item) => item.variantId === input.variantId);
    const nextQuantity = (existing?.quantity ?? 0) + input.quantity;

    if (nextQuantity > variant.stockAvailable) {
      throw new BadRequestException({
        code: "STOCK_NOT_ENOUGH",
        message: `Stok ${variant.product.name} tinggal ${variant.stockAvailable}. Kurangi jumlahnya.`,
      });
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
      update: { quantity: nextQuantity, isSelected: true },
      create: {
        cartId: cart.id,
        variantId: input.variantId,
        quantity: input.quantity,
        isSelected: true,
      },
    });

    return this.view(userId);
  }

  async update(
    userId: string,
    itemId: string,
    input: UpdateCartItemInput,
  ): Promise<CartView> {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: { variant: { select: { stockAvailable: true } } },
    });

    if (!item) {
      throw new NotFoundException({
        code: "CART_ITEM_NOT_FOUND",
        message: "Barang di keranjang tidak ditemukan.",
      });
    }

    if (input.quantity !== undefined && input.quantity > item.variant.stockAvailable) {
      throw new BadRequestException({
        code: "STOCK_NOT_ENOUGH",
        message: `Stok tinggal ${item.variant.stockAvailable}. Kurangi jumlahnya.`,
      });
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: {
        ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        ...(input.isSelected !== undefined ? { isSelected: input.isSelected } : {}),
      },
    });

    return this.view(userId);
  }

  async remove(userId: string, itemId: string): Promise<CartView> {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException({
        code: "CART_ITEM_NOT_FOUND",
        message: "Barang di keranjang tidak ditemukan.",
      });
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.view(userId);
  }
}
