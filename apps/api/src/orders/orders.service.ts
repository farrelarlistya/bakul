import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ORDER_STATUS_VALUES,
  type OrderInvoiceView,
  type ReviewInput,
} from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { StorageService } from "../common/storage/storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { orderInvoiceInclude, toOrderInvoiceView } from "./order-view.mapper";
import { OrderLifecycleService } from "./order-lifecycle.service";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly lifecycle: OrderLifecycleService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
  ) {}

  async list(userId: string, status?: string): Promise<OrderInvoiceView[]> {
    const validStatus =
      status && (ORDER_STATUS_VALUES as readonly string[]).includes(status)
        ? status
        : undefined;

    const rows = await this.prisma.orderInvoice.findMany({
      where: {
        buyerId: userId,
        ...(validStatus
          ? { orderStatus: validStatus as (typeof ORDER_STATUS_VALUES)[number] }
          : {}),
      },
      include: orderInvoiceInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const now = this.clock.now();
    return rows.map((row) => toOrderInvoiceView(row, now));
  }

  async detail(userId: string, invoiceId: string): Promise<OrderInvoiceView> {
    const row = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId: userId },
      include: orderInvoiceInclude,
    });

    if (!row) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      });
    }

    return toOrderInvoiceView(row, this.clock.now());
  }

  complete(userId: string, invoiceId: string): Promise<{ ok: true }> {
    return this.lifecycle.buyerComplete(userId, invoiceId);
  }

  async review(
    userId: string,
    invoiceId: string,
    input: ReviewInput,
  ): Promise<{ ok: true; count: number }> {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId: userId },
      include: {
        shop: { select: { ownerUserId: true } },
        items: { include: { review: { select: { id: true } } } },
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      });
    }

    if (invoice.orderStatus !== "COMPLETED") {
      throw new ConflictException({
        code: "REVIEW_NOT_ALLOWED",
        message: "Ulasan bisa ditulis setelah pesanan selesai.",
      });
    }

    const unreviewed = invoice.items.filter((item) => !item.review && item.productId);
    if (unreviewed.length === 0) {
      throw new ConflictException({
        code: "REVIEW_DONE",
        message: "Barang di pesanan ini sudah kamu ulas.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of unreviewed) {
        if (!item.productId) {
          continue;
        }

        await tx.review.create({
          data: {
            orderItemId: item.id,
            productId: item.productId,
            buyerId: userId,
            rating: input.rating,
            comment: input.comment ?? null,
            mediaUrls: (input.mediaUrls ?? []) as unknown as string[],
            createdAt: this.clock.now(),
          },
        });

        const aggregate = await tx.review.aggregate({
          where: { productId: item.productId },
          _avg: { rating: true },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { avgRating: Number(aggregate._avg.rating ?? 0) },
        });
      }

      await this.notifications.send(
        invoice.shop.ownerUserId,
        "ORDER",
        `Pembeli memberi ulasan ${input.rating} bintang untuk pesanan ${invoice.invoiceNumber}.`,
        { invoiceId: invoice.id },
        tx,
      );
    });

    return { ok: true, count: unreviewed.length };
  }

  async uploadReviewEvidence(
    userId: string,
    invoiceId: string,
    file: Express.Multer.File | undefined,
  ): Promise<{ url: string }> {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId: userId },
      select: { id: true },
    });
    if (!invoice) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      });
    }

    const url = await this.storage.saveEvidence(file);
    if (!url) {
      throw new BadRequestException({
        code: "PHOTO_REQUIRED",
        message: "Pilih foto ulasan dulu.",
      });
    }
    return { url };
  }

  async ensureReviewable(userId: string, invoiceId: string): Promise<void> {    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId: userId },
      select: { orderStatus: true },
    });
    if (!invoice) {
      throw new BadRequestException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      });
    }
  }
}
