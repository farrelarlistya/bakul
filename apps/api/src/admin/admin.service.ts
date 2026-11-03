import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminMetrics,
  AdminProductRow,
  AdminShopRow,
  AdminShopStatusInput,
  ProductStatusValue,
} from "@bakul/shared";
import { LEDGER_ACCOUNTS } from "@bakul/shared";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async metrics(): Promise<AdminMetrics> {
    const [
      gmv,
      escrow,
      orderCount,
      completedOrders,
      activeShops,
      activeProducts,
      waitingSeller,
      delivered,
      openDisputes,
      pendingWithdrawals,
      byStatus,
      recent,
      revenueEntries,
    ] = await Promise.all([
      this.prisma.orderInvoice.aggregate({
        where: { paidAt: { not: null } },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderInvoice.aggregate({
        where: { escrowStatus: { in: ["HELD", "FROZEN"] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderInvoice.count(),
      this.prisma.orderInvoice.count({ where: { orderStatus: "COMPLETED" } }),
      this.prisma.shop.count({ where: { status: "ACTIVE" } }),
      this.prisma.product.count({ where: { status: "ACTIVE" } }),
      this.prisma.orderInvoice.count({
        where: { orderStatus: "WAITING_SELLER_CONFIRMATION" },
      }),
      this.prisma.orderInvoice.count({ where: { orderStatus: "DELIVERED" } }),
      this.prisma.dispute.count({
        where: {
          status: {
            in: ["OPEN", "WAITING_SELLER", "ESCALATED_TO_ADMIN"],
          },
        },
      }),
      this.prisma.withdrawal.count({ where: { status: "REQUESTED" } }),
      this.prisma.orderInvoice.groupBy({
        by: ["orderStatus"],
        _count: { _all: true },
      }),
      this.prisma.orderInvoice.findMany({
        include: {
          shop: { select: { name: true } },
          buyer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.ledgerEntry.findMany({
        where: { accountCode: LEDGER_ACCOUNTS.PLATFORM_REVENUE },
      }),
    ]);

    const revenue = revenueEntries.reduce(
      (total, entry) =>
        total + (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0,
    );

    return {
      gmv: gmv._sum.totalAmount ?? 0,
      escrowHeld: escrow._sum.totalAmount ?? 0,
      revenue,
      orderCount,
      completedOrders,
      activeShops,
      activeProducts,
      waitingSeller,
      delivered,
      openDisputes,
      pendingWithdrawals,
      ordersByStatus: byStatus.map((row) => ({
        status: row.orderStatus,
        count: row._count._all,
      })),
      recentOrders: recent.map((row) => ({
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        shopName: row.shop.name,
        buyerName: row.buyer.name,
        totalAmount: row.totalAmount,
        orderStatus: row.orderStatus,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async shops(): Promise<AdminShopRow[]> {
    const rows = await this.prisma.shop.findMany({
      include: {
        owner: { select: { name: true, phone: true } },
        wallet: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      cityName: row.cityName,
      status: row.status,
      productCount: row._count.products,
      balanceAvailable: row.wallet?.balanceAvailable ?? 0,
      ownerName: row.owner.name,
      ownerPhone: row.owner.phone,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async products(query?: string): Promise<AdminProductRow[]> {
    const rows = await this.prisma.product.findMany({
      where: query
        ? { name: { contains: query, mode: "insensitive" } }
        : undefined,
      include: {
        shop: { select: { name: true } },
        variants: { select: { price: true, stockAvailable: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      shopName: row.shop.name,
      status: row.status,
      price:
        row.variants.length > 0
          ? Math.min(...row.variants.map((variant) => variant.price))
          : 0,
      stock: row.variants.reduce(
        (total, variant) => total + variant.stockAvailable,
        0,
      ),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async setShopStatus(
    shopId: string,
    input: AdminShopStatusInput,
  ): Promise<{ ok: true; status: string }> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!shop) {
      throw new NotFoundException({
        code: "SHOP_NOT_FOUND",
        message: "Toko tidak ditemukan.",
      });
    }

    await this.prisma.shop.update({
      where: { id: shop.id },
      data: { status: input.status },
    });

    const message =
      input.status === "ACTIVE"
        ? `Toko ${shop.name} sudah aktif lagi.`
        : `Toko ${shop.name} dinonaktifkan sementara. Hubungi admin kalau perlu bantuan.`;
    await this.notifications.send(shop.owner.id, "ORDER", message, {
      shopId: shop.id,
      note: input.note,
    });

    return { ok: true, status: input.status };
  }

  async setProductStatus(
    productId: string,
    status: ProductStatusValue,
  ): Promise<{ ok: true; status: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: { select: { ownerUserId: true } } },
    });

    if (!product) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Barang tidak ditemukan.",
      });
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: { status },
    });

    await this.notifications.send(
      product.shop.ownerUserId,
      "ORDER",
      status === "ACTIVE"
        ? `Barang ${product.name} sudah tampil lagi di katalog.`
        : `Barang ${product.name} disembunyikan admin dari katalog.`,
      { productId: product.id },
    );

    return { ok: true, status };
  }
}
