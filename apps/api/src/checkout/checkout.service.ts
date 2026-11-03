import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PAYMENT_METHODS,
  calculateTotals,
  courierName,
  findWilayah,
  sumOrderTotals,
  type CheckoutInput,
  type CheckoutQuote,
  type CheckoutResult,
  type CheckoutShopQuote,
} from "@bakul/shared";
import { randomBytes } from "node:crypto";
import { ClockService } from "../common/clock/clock.service";
import { InventoryService } from "../common/inventory/inventory.service";
import { Prisma } from "../generated/prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { MockPgService } from "../payments/mock-pg.service";
import { ShippingService } from "../shipping/shipping.service";

type CartGroupRow = {
  shopId: string;
  shopName: string;
  shopSlug: string;
  cityId: string;
  cityName: string;
  supportedCouriers: string[];
  items: {
    id: string;
    variantId: string;
    productId: string;
    productName: string;
    productSlug: string;
    variantName: string;
    price: number;
    quantity: number;
    weightGram: number;
    imageUrl: string | null;
    stockAvailable: number;
  }[];
  subtotal: number;
  weightGram: number;
};

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shipping: ShippingService,
    private readonly inventory: InventoryService,
    private readonly mockPg: MockPgService,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  async quote(userId: string, addressId: string): Promise<CheckoutQuote> {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException({
        code: "ADDRESS_NOT_FOUND",
        message: "Alamat tidak ditemukan. Pilih alamat lain.",
      });
    }

    const groups = await this.selectedGroups(userId);
    if (groups.length === 0) {
      throw new BadRequestException({
        code: "CART_EMPTY",
        message: "Pilih minimal satu barang di keranjang.",
      });
    }

    const shops: CheckoutShopQuote[] = groups.map((group) => {
      const rates = this.shipping.getRates({
        originCityId: group.cityId,
        destinationCityId: address.cityId,
        weightGram: group.weightGram,
        couriers: group.supportedCouriers,
      });

      return {
        shopId: group.shopId,
        shopName: group.shopName,
        shopSlug: group.shopSlug,
        cityName: group.cityName,
        subtotal: group.subtotal,
        weightGram: group.weightGram,
        items: group.items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          variantName: item.variantName,
          shopId: group.shopId,
          shopName: group.shopName,
          price: item.price,
          quantity: item.quantity,
          stockAvailable: item.stockAvailable,
          weightGram: item.weightGram,
          imageUrl: item.imageUrl,
          isSelected: true,
        })),
        rates,
      };
    });

    const totals = sumOrderTotals(
      shops.map((shop) => ({
        subtotalItems: shop.subtotal,
        shippingCost: shop.rates[0]?.cost ?? 0,
      })),
    );

    return {
      address: {
        id: address.id,
        label: address.label,
        recipientName: address.recipientName,
        phone: address.phone,
        provinceId: address.provinceId,
        cityId: address.cityId,
        districtId: address.districtId,
        postalCode: address.postalCode,
        fullAddress: address.fullAddress,
        isDefault: address.isDefault,
      },
      shops,
      subtotalItems: totals.subtotalItems,
      totalWeightGram: shops.reduce((total, shop) => total + shop.weightGram, 0),
      serviceFee: totals.serviceFee,
      totalAmount: totals.totalAmount,
    };
  }

  async checkout(
    userId: string,
    input: CheckoutInput,
    idempotencyKey: string | undefined,
  ): Promise<CheckoutResult> {
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{8,100}$/.test(idempotencyKey)) {
      throw new BadRequestException({
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Permintaan bayar tidak lengkap. Muat ulang halaman lalu coba lagi.",
      });
    }

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { invoices: { select: { id: true } } },
    });
    if (existing) {
      if (existing.buyerId !== userId) {
        throw new ConflictException({
          code: "IDEMPOTENCY_KEY_USED",
          message: "Permintaan ini sudah dipakai. Muat ulang halaman.",
        });
      }
      return this.resultFor(existing);
    }

    const address = await this.prisma.userAddress.findFirst({
      where: { id: input.addressId, userId },
    });
    if (!address) {
      throw new NotFoundException({
        code: "ADDRESS_NOT_FOUND",
        message: "Alamat tidak ditemukan. Pilih alamat lain.",
      });
    }

    const area = findWilayah(address.cityId);
    if (!area) {
      throw new BadRequestException({
        code: "CITY_UNSUPPORTED",
        message: "Kota alamat belum didukung. Pilih alamat lain.",
      });
    }

    const groups = await this.selectedGroups(userId);
    if (groups.length === 0) {
      throw new BadRequestException({
        code: "CART_EMPTY",
        message: "Keranjang kosong. Pilih barang dulu.",
      });
    }

    this.validateShipping(input, groups);

    const method = PAYMENT_METHODS.find((item) => item.value === input.paymentMethod);
    if (!method) {
      throw new BadRequestException({
        code: "PAYMENT_METHOD_INVALID",
        message: "Cara bayar belum tersedia. Pilih cara bayar lain.",
      });
    }

    const shippingByShop = new Map(input.shipping.map((row) => [row.shopId, row]));
    const invoicePlans = groups.map((group) => {
      const choice = shippingByShop.get(group.shopId);
      if (!choice) {
        throw new BadRequestException({
          code: "COURIER_REQUIRED",
          message: `Pilih kurir untuk ${group.shopName}.`,
        });
      }

      const rates = this.shipping.getRates({
        originCityId: group.cityId,
        destinationCityId: address.cityId,
        weightGram: group.weightGram,
        couriers: group.supportedCouriers,
      });
      const rate = rates.find(
        (item) => item.courier === choice.courier && item.service === choice.service,
      );

      if (!rate) {
        throw new BadRequestException({
          code: "COURIER_UNAVAILABLE",
          message: `Kurir ${choice.courier} ${choice.service} tidak melayani ${group.shopName}. Pilih kurir lain.`,
        });
      }

      return {
        group,
        rate,
        totals: calculateTotals({
          subtotalItems: group.subtotal,
          shippingCost: rate.cost,
        }),
      };
    });

    const paymentTotal = invoicePlans.reduce(
      (total, plan) => total + plan.totals.totalAmount,
      0,
    );
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + method.expiryMinutes * 60_000);

    try {
      const payment = await this.prisma.$transaction(
        async (tx) => {
          const ids = groups.flatMap((group) => group.items.map((item) => item.variantId));
          const quantities = new Map<string, number>();
          for (const group of groups) {
            for (const item of group.items) {
              quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
            }
          }

          const locked = await this.inventory.lock(tx, [...quantities.keys()]);
          const lockedById = new Map(locked.map((row) => [row.id, row]));
          const nameByVariant = new Map(
            groups.flatMap((group) =>
              group.items.map((item) => [item.variantId, item.productName] as const),
            ),
          );

          for (const [variantId, quantity] of quantities) {
            const row = lockedById.get(variantId);
            if (!row || row.stock_available < quantity) {
              const name = nameByVariant.get(variantId) ?? "Barang";
              throw new ConflictException({
                code: "STOCK_NOT_ENOUGH",
                message: `Stok ${name} tinggal ${row?.stock_available ?? 0}. Kurangi jumlahnya lalu coba lagi.`,
              });
            }
          }

          // Stok dikunci: tersedia turun, ditahan naik.
          await this.inventory.reserve(tx, locked, quantities);

          const charge = await this.uniqueCharge(tx, method.value, expiresAt);

          const createdPayment = await tx.payment.create({
            data: {
              buyerId: userId,
              idempotencyKey,
              paymentCode: charge.paymentCode,
              method: input.paymentMethod,
              providerRef: charge.providerRef,
              totalAmount: paymentTotal,
              status: "PENDING",
              expiresAt,
              createdAt: now,
            },
          });

          for (let index = 0; index < invoicePlans.length; index += 1) {
            const plan = invoicePlans[index];
            if (!plan) {
              continue;
            }

            const invoiceNumber = this.invoiceNumber(now, index);
            await tx.orderInvoice.create({
              data: {
                paymentId: createdPayment.id,
                invoiceNumber,
                buyerId: userId,
                shopId: plan.group.shopId,
                recipientName: address.recipientName,
                recipientPhone: address.phone,
                cityId: address.cityId,
                cityName: area.cityName,
                districtName: area.districtName,
                postalCode: address.postalCode,
                fullAddress: address.fullAddress,
                notes: input.notes ?? null,
                subtotal: plan.totals.subtotalItems,
                shippingCost: plan.totals.shippingCost,
                serviceFee: plan.totals.serviceFee,
                platformFee: plan.totals.platformFee,
                netSellerAmount: plan.totals.netSellerAmount,
                totalAmount: plan.totals.totalAmount,
                courierCode: plan.rate.courier,
                courierName: courierName(plan.rate.courier),
                courierService: plan.rate.service,
                weightGram: plan.group.weightGram,
                escrowStatus: "PENDING",
                orderStatus: "WAITING_PAYMENT",
                sellerConfirmDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
                createdAt: now,
                updatedAt: now,
                items: {
                  create: plan.group.items.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    nameSnapshot: item.productName,
                    variantSnapshot: item.variantName,
                    priceSnapshot: item.price,
                    weightSnapshot: item.weightGram,
                    quantity: item.quantity,
                    imageUrl: item.imageUrl,
                  })),
                },
              },
            });
          }

          await tx.cartItem.deleteMany({
            where: { id: { in: groups.flatMap((group) => group.items.map((item) => item.id)) } },
          });

          await this.notifications.send(
            userId,
            "PAYMENT",
            `Tagihan ${charge.paymentCode} sudah dibuat. Bayar sebelum ${expiresAt.toLocaleString("id-ID")} supaya pesanan tidak batal.`,
            { paymentId: createdPayment.id, paymentCode: charge.paymentCode },
            tx,
          );

          return createdPayment;
        },
        { maxWait: 30_000, timeout: 30_000 },
      );

      const count = await this.prisma.orderInvoice.count({
        where: { paymentId: payment.id },
      });
      return this.resultFor(payment, count);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        const duplicate = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
          include: { invoices: { select: { id: true } } },
        });
        if (duplicate && duplicate.buyerId === userId) {
          return this.resultFor(duplicate);
        }
      }
      throw error;
    }
  }

  private validateShipping(input: CheckoutInput, groups: CartGroupRow[]): void {
    const shopIds = new Set(groups.map((group) => group.shopId));
    const seen = new Set<string>();

    for (const choice of input.shipping) {
      if (!shopIds.has(choice.shopId)) {
        throw new BadRequestException({
          code: "SHOP_NOT_IN_CART",
          message: "Ada toko yang tidak ada di keranjang. Muat ulang halaman.",
        });
      }
      if (seen.has(choice.shopId)) {
        throw new BadRequestException({
          code: "COURIER_DUPLICATE",
          message: "Pilih satu kurir untuk setiap toko.",
        });
      }
      seen.add(choice.shopId);
    }

    if (seen.size !== shopIds.size) {
      throw new BadRequestException({
        code: "COURIER_REQUIRED",
        message: "Pilih kurir untuk setiap toko.",
      });
    }
  }

  private async selectedGroups(userId: string): Promise<CartGroupRow[]> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { isSelected: true },
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { position: "asc" }, take: 1 },
                    shop: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      return [];
    }

    const groups = new Map<string, CartGroupRow>();
    for (const item of cart.items) {
      const product = item.variant.product;
      if (product.status !== "ACTIVE" || product.shop.status !== "ACTIVE") {
        continue;
      }

      const group = groups.get(product.shopId) ?? {
        shopId: product.shopId,
        shopName: product.shop.name,
        shopSlug: product.shop.slug,
        cityId: product.shop.cityId,
        cityName: product.shop.cityName,
        supportedCouriers: product.shop.supportedCouriers,
        items: [],
        subtotal: 0,
        weightGram: 0,
      };

      group.items.push({
        id: item.id,
        variantId: item.variantId,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantName: item.variant.name,
        price: item.variant.price,
        quantity: item.quantity,
        weightGram: product.weightGram,
        imageUrl: product.images[0]?.url ?? null,
        stockAvailable: item.variant.stockAvailable,
      });
      group.subtotal += item.variant.price * item.quantity;
      group.weightGram += product.weightGram * item.quantity;
      groups.set(product.shopId, group);
    }

    return [...groups.values()];
  }

  private async uniqueCharge(
    tx: Prisma.TransactionClient,
    method: string,
    expiresAt: Date,
  ) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const charge = await this.mockPg.createCharge({
        reference: "",
        amount: 0,
        method,
        expiresAt,
      });
      const exists = await tx.payment.findFirst({
        where: {
          OR: [{ paymentCode: charge.paymentCode }, { providerRef: charge.providerRef }],
        },
        select: { id: true },
      });
      if (!exists) {
        return charge;
      }
    }

    throw new ConflictException({
      code: "PAYMENT_CODE_EXHAUSTED",
      message: "Kode pembayaran gagal dibuat. Coba lagi.",
    });
  }

  private invoiceNumber(now: Date, index: number): string {
    const date = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return `INV-${date}-${randomBytes(2).toString("hex").toUpperCase()}${index + 1}`;
  }

  private resultFor(
    payment: {
      id: string;
      paymentCode: string;
      totalAmount: number;
      expiresAt: Date;
      invoices?: { id: string }[];
    },
    count?: number,
  ): CheckoutResult {
    return {
      paymentId: payment.id,
      paymentCode: payment.paymentCode,
      totalAmount: payment.totalAmount,
      expiresAt: payment.expiresAt.toISOString(),
      invoiceCount: count ?? payment.invoices?.length ?? 0,
    };
  }
}
