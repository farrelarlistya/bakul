import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { AUTO_COMPLETE_HOURS, SELLER_CONFIRM_HOURS, type TrackingEvent } from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { InventoryService } from "../common/inventory/inventory.service";
import { Prisma } from "../generated/prisma/client";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { ShippingService } from "../shipping/shipping.service";

const lifecycleInclude = {
  shop: {
    select: {
      id: true,
      name: true,
      ownerUserId: true,
      cityId: true,
      cityName: true,
      owner: { select: { phone: true } },
    },
  },
  items: true,
  payment: true,
  dispute: true,
  shipment: true,
} satisfies Prisma.OrderInvoiceInclude;

type InvoiceRow = Prisma.OrderInvoiceGetPayload<{ include: typeof lifecycleInclude }>;

@Injectable()
export class OrderLifecycleService {
  private readonly logger = new Logger(OrderLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly ledger: LedgerService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly shipping: ShippingService,
  ) {}

  async processDue(): Promise<{
    shipments: number;
    cancelled: number;
    completed: number;
  }> {
    const now = this.clock.now();
    const shipments = await this.progressShipments(now);
    const cancelled = await this.cancelLateSellers(now);
    const completed = await this.autoCompleteDelivered(now);

    return { shipments, cancelled, completed };
  }

  async acceptInvoice(sellerUserId: string, invoiceId: string): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await this.sellerInvoice(tx, sellerUserId, invoiceId);
      if (invoice.orderStatus !== "WAITING_SELLER_CONFIRMATION") {
        throw new ConflictException({
          code: "ORDER_STATUS_INVALID",
          message: "Pesanan ini sudah diproses. Muat ulang halaman.",
        });
      }

      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: { orderStatus: "PROCESSING", acceptedAt: now },
      });

      await this.notifications.send(
        invoice.buyerId,
        "ORDER",
        `Penjual sudah menerima pesanan ${invoice.invoiceNumber}. Paket akan disiapkan.`,
        { invoiceId: invoice.id },
        tx,
      );
    });

    return { ok: true };
  }

  async rejectInvoice(
    sellerUserId: string,
    invoiceId: string,
    reason: string,
  ): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await this.sellerInvoice(tx, sellerUserId, invoiceId);
      if (
        invoice.orderStatus !== "WAITING_SELLER_CONFIRMATION" &&
        invoice.orderStatus !== "PROCESSING"
      ) {
        throw new ConflictException({
          code: "ORDER_STATUS_INVALID",
          message: "Pesanan ini tidak bisa ditolak lagi.",
        });
      }

      await this.cancelPaidInvoice(invoice, tx, now, `Penjual menolak: ${reason}`);
    });

    return { ok: true };
  }

  async createShipment(
    sellerUserId: string,
    invoiceId: string,
  ): Promise<{ awb: string; labelUrl: string }> {
    const now = this.clock.now();

    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.sellerInvoice(tx, sellerUserId, invoiceId);

      if (invoice.shipment) {
        return {
          awb: invoice.shipment.awb,
          labelUrl: invoice.shipment.labelUrl ?? "",
        };
      }

      if (invoice.orderStatus !== "PROCESSING") {
        throw new ConflictException({
          code: "ORDER_NOT_READY",
          message: "Terima pesanan dulu sebelum membuat resi.",
        });
      }

      const awb = this.shipping.awbFor(invoice.id, invoice.courierCode);
      const labelUrl = `/api/v1/seller/orders/${invoice.id}/label.pdf`;

      await tx.shipment.create({
        data: {
          orderInvoiceId: invoice.id,
          courierCode: invoice.courierCode,
          courierName: invoice.courierName,
          serviceType: invoice.courierService,
          awb,
          labelUrl,
          shippingStatus: "AWB_CREATED",
          trackingHistory: [],
          createdAt: now,
        },
      });

      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: { orderStatus: "READY_TO_SHIP" },
      });

      await this.notifications.send(
        invoice.buyerId,
        "SHIPPING",
        `Paket ${invoice.invoiceNumber} sudah disiapkan penjual. Nomor resi ${awb}.`,
        { invoiceId: invoice.id, awb },
        tx,
      );

      return { awb, labelUrl };
    });
  }

  async buyerComplete(buyerId: string, invoiceId: string): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.orderInvoice.findFirst({
        where: { id: invoiceId, buyerId },
        include: lifecycleInclude,
      });

      if (!invoice) {
        throw new NotFoundException({
          code: "INVOICE_NOT_FOUND",
          message: "Pesanan tidak ditemukan.",
        });
      }

      if (invoice.orderStatus === "COMPLETED") {
        return;
      }

      if (invoice.orderStatus !== "DELIVERED") {
        throw new ConflictException({
          code: "ORDER_NOT_DELIVERED",
          message: "Pesanan belum sampai. Tunggu paketnya tiba dulu.",
        });
      }

      if (invoice.dispute) {
        throw new ConflictException({
          code: "ORDER_DISPUTED",
          message: "Pesanan sedang dikomplain. Tunggu keputusan admin.",
        });
      }

      await this.releaseInvoice(invoice, tx, now);
    });

    return { ok: true };
  }

  async releaseDisputed(
    invoiceId: string,
    adminId: string,
    note: string,
  ): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.orderInvoice.findUnique({
        where: { id: invoiceId },
        include: lifecycleInclude,
      });
      if (!invoice) {
        throw new NotFoundException({
          code: "INVOICE_NOT_FOUND",
          message: "Pesanan tidak ditemukan.",
        });
      }

      await tx.dispute.update({
        where: { orderInvoiceId: invoice.id },
        data: {
          status: "RESOLVED_SELLER",
          decisionNote: note,
          resolvedBy: adminId,
          resolvedAt: now,
        },
      });

      await this.releaseInvoice(invoice, tx, now);

      await this.notifications.send(
        invoice.buyerId,
        "DISPUTE",
        `Komplain ${invoice.invoiceNumber} sudah diputuskan. Dana diteruskan ke penjual.`,
        { invoiceId: invoice.id },
        tx,
      );
    });

    return { ok: true };
  }

  async refundDisputed(
    invoiceId: string,
    adminId: string,
    note: string,
    refundAmount?: number,
    releaseStock = false,
  ): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.orderInvoice.findUnique({
        where: { id: invoiceId },
        include: lifecycleInclude,
      });
      if (!invoice) {
        throw new NotFoundException({
          code: "INVOICE_NOT_FOUND",
          message: "Pesanan tidak ditemukan.",
        });
      }

      const partial = refundAmount !== undefined && refundAmount < invoice.totalAmount;

      if (partial) {
        if (refundAmount === undefined || refundAmount <= 0) {
          throw new BadRequestException({
            code: "REFUND_AMOUNT_INVALID",
            message: "Jumlah uang kembali belum benar.",
          });
        }
        const result = await this.ledger.partialRefund(tx, invoice, refundAmount);
        await tx.orderInvoice.update({
          where: { id: invoice.id },
          data: {
            orderStatus: "REFUNDED",
            escrowStatus: "PARTIALLY_REFUNDED",
            completedAt: now,
          },
        });
        await this.creditWallet(tx, invoice.shopId, result.sellerAmount);
        await this.inventory.commit(tx, invoice.items);
      } else {
        await this.ledger.refundEscrow(tx, invoice);
        await tx.orderInvoice.update({
          where: { id: invoice.id },
          data: {
            orderStatus: "REFUNDED",
            escrowStatus: "REFUNDED",
            completedAt: now,
          },
        });
        if (releaseStock) {
          await this.inventory.release(tx, invoice.items);
        } else {
          await this.inventory.commit(tx, invoice.items);
        }
      }

      await tx.dispute.update({
        where: { orderInvoiceId: invoice.id },
        data: {
          status: "RESOLVED_BUYER",
          decisionNote: note,
          resolvedBy: adminId,
          resolvedAt: now,
        },
      });

      await this.notifications.send(
        invoice.buyerId,
        "DISPUTE",
        `Komplain ${invoice.invoiceNumber} diputuskan. ${
          partial
            ? `Sebagian uang Rp ${(refundAmount ?? 0).toLocaleString("id-ID")} dikembalikan.`
            : "Uang dikembalikan penuh."
        }`,
        { invoiceId: invoice.id },
        tx,
      );
      await this.notifications.send(
        invoice.shop.ownerUserId,
        "DISPUTE",
        `Komplain ${invoice.invoiceNumber} diputuskan. ${
          partial ? "Sebagian dana diteruskan ke tokomu." : "Dana dikembalikan ke pembeli."
        }`,
        { invoiceId: invoice.id },
        tx,
      );

      await this.syncPaymentRefunded(tx, invoice.paymentId);
    });

    return { ok: true };
  }

  async markReturning(invoiceId: string, adminId: string, note: string): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.orderInvoice.findUnique({
        where: { id: invoiceId },
        include: lifecycleInclude,
      });
      if (!invoice) {
        throw new NotFoundException({
          code: "INVOICE_NOT_FOUND",
          message: "Pesanan tidak ditemukan.",
        });
      }

      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: { orderStatus: "RETURNING" },
      });
      await tx.dispute.update({
        where: { orderInvoiceId: invoice.id },
        data: { decisionNote: note, resolvedBy: adminId, resolvedAt: now },
      });
      await this.notifications.send(
        invoice.buyerId,
        "DISPUTE",
        `Keputusan: barang ${invoice.invoiceNumber} dikembalikan ke penjual. Ikuti petunjuk pengiriman dari admin.`,
        { invoiceId: invoice.id },
        tx,
      );
    });

    return { ok: true };
  }

  async markReturned(invoiceId: string, adminId: string, note: string): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.orderInvoice.findUnique({
        where: { id: invoiceId },
        include: lifecycleInclude,
      });
      if (!invoice) {
        throw new NotFoundException({
          code: "INVOICE_NOT_FOUND",
          message: "Pesanan tidak ditemukan.",
        });
      }

      await this.ledger.refundEscrow(tx, invoice);
      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: {
          orderStatus: "RETURNED",
          escrowStatus: "REFUNDED",
          completedAt: now,
        },
      });
      await this.inventory.release(tx, invoice.items);
      await tx.dispute.update({
        where: { orderInvoiceId: invoice.id },
        data: {
          status: "RESOLVED_BUYER",
          decisionNote: note,
          resolvedBy: adminId,
          resolvedAt: now,
        },
      });
      await this.syncPaymentRefunded(tx, invoice.paymentId);
      await this.notifications.send(
        invoice.buyerId,
        "DISPUTE",
        `Barang ${invoice.invoiceNumber} sudah kembali ke penjual. Uangmu dikembalikan penuh.`,
        { invoiceId: invoice.id },
        tx,
      );
    });

    return { ok: true };
  }

  async processSellerRefund(invoiceId: string, sellerUserId: string): Promise<{ ok: true }> {
    const now = this.clock.now();
    await this.prisma.$transaction(async (tx) => {
      const invoice = await this.sellerInvoice(tx, sellerUserId, invoiceId);
      if (!invoice.dispute || invoice.orderStatus !== "DISPUTED") {
        throw new ConflictException({
          code: "DISPUTE_NOT_FOUND",
          message: "Komplain tidak ditemukan.",
        });
      }

      await this.ledger.refundEscrow(tx, invoice);
      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: {
          orderStatus: "REFUNDED",
          escrowStatus: "REFUNDED",
          completedAt: now,
        },
      });
      await this.inventory.commit(tx, invoice.items);
      await tx.dispute.update({
        where: { orderInvoiceId: invoice.id },
        data: {
          status: "RESOLVED_BUYER",
          decisionNote: "Penjual menyetujui pengembalian uang.",
          resolvedAt: now,
        },
      });
      await this.syncPaymentRefunded(tx, invoice.paymentId);
      await this.notifications.send(
        invoice.buyerId,
        "DISPUTE",
        `Penjual menyetujui pengembalian uang ${invoice.invoiceNumber}. Dana akan kembali penuh.`,
        { invoiceId: invoice.id },
        tx,
      );
    });

    return { ok: true };
  }

  renderLabelInvoice(invoice: InvoiceRow, shipment: { awb: string }) {
    return {
      awb: shipment.awb,
      courierCode: invoice.courierCode,
      courierName: invoice.courierName,
      serviceType: invoice.courierService,
      invoiceNumber: invoice.invoiceNumber,
      originName: invoice.shop.name,
      originCity: invoice.shop.cityName,
      originPhone: invoice.shop.owner.phone,
      recipientName: invoice.recipientName,
      recipientPhone: invoice.recipientPhone,
      destinationCity: invoice.cityName,
      destinationDistrict: invoice.districtName,
      destinationPostal: invoice.postalCode,
      fullAddress: invoice.fullAddress,
      weightGram: invoice.weightGram,
      itemCount: invoice.items.reduce((total, item) => total + item.quantity, 0),
    };
  }

  private async progressShipments(now: Date): Promise<number> {
    const shipments = await this.prisma.shipment.findMany({
      where: {
        shippingStatus: {
          in: ["AWB_CREATED", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_DESTINATION", "OUT_FOR_DELIVERY"],
        },
        orderInvoice: {
          orderStatus: { in: ["READY_TO_SHIP", "SHIPPED", "IN_TRANSIT"] },
        },
      },
      include: {
        orderInvoice: { include: lifecycleInclude },
      },
      take: 100,
    });

    let count = 0;
    for (const shipment of shipments) {
      const invoice = shipment.orderInvoice;
      const existing = this.shipping.asEvents(shipment.trackingHistory);
      const timeline = this.shipping.buildTimeline(
        {
          id: shipment.id,
          createdAt: shipment.createdAt,
          courierCode: shipment.courierCode,
          courierName: shipment.courierName,
          serviceType: shipment.serviceType,
          awb: shipment.awb,
          originCity: invoice.shop.cityName,
          destinationCity: invoice.cityName,
          destinationDistrict: invoice.districtName,
          recipientName: invoice.recipientName,
        },
        now,
        existing,
      );

      if (timeline.events.length === existing.length) {
        continue;
      }

      const latest = timeline.events.at(-1);
      if (!latest) {
        continue;
      }

      const status = timeline.status;
      const orderStatus: "DELIVERED" | "SHIPPED" | "IN_TRANSIT" =
        status === "DELIVERED"
          ? "DELIVERED"
          : status === "PICKED_UP"
            ? "SHIPPED"
            : "IN_TRANSIT";

      await this.prisma.$transaction(async (tx) => {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            trackingHistory: timeline.events as unknown as Prisma.InputJsonValue,
            shippingStatus: status as
              | "PICKED_UP"
              | "IN_TRANSIT"
              | "ARRIVED_AT_DESTINATION"
              | "OUT_FOR_DELIVERY"
              | "DELIVERED",
            shippedAt: invoice.shippedAt ?? new Date(latest.at),
            deliveredAt: timeline.deliveredAt,
          },
        });

        await tx.orderInvoice.update({
          where: { id: invoice.id },
          data: {
            orderStatus,
            ...(status === "PICKED_UP" && !invoice.shippedAt
              ? { shippedAt: new Date(latest.at) }
              : {}),
            ...(status === "DELIVERED"
              ? {
                  deliveredAt: timeline.deliveredAt ?? new Date(latest.at),
                  autoCompleteAt: new Date(
                    (timeline.deliveredAt ?? new Date(latest.at)).getTime() +
                      AUTO_COMPLETE_HOURS * 60 * 60 * 1000,
                  ),
                }
              : {}),
          },
        });

        if (status === "DELIVERED") {
          await this.notifications.send(
            invoice.buyerId,
            "SHIPPING",
            `Paket ${invoice.invoiceNumber} sudah sampai. Cek barangnya, lalu tekan “Pesanan Selesai”. Kalau ada masalah, ajukan komplain dalam 48 jam.`,
            { invoiceId: invoice.id, awb: shipment.awb },
            tx,
          );
          await this.notifications.send(
            invoice.shop.ownerUserId,
            "SHIPPING",
            `Paket ${invoice.invoiceNumber} sudah sampai di pembeli.`,
            { invoiceId: invoice.id },
            tx,
          );
        } else if (status === "PICKED_UP") {
          await this.notifications.send(
            invoice.buyerId,
            "SHIPPING",
            `Paket ${invoice.invoiceNumber} sudah dikirim. Lacak dengan nomor resi ${shipment.awb}.`,
            { invoiceId: invoice.id, awb: shipment.awb },
            tx,
          );
        }
      });

      count += 1;
    }

    return count;
  }

  private async cancelLateSellers(now: Date): Promise<number> {
    const invoices = await this.prisma.orderInvoice.findMany({
      where: {
        orderStatus: "WAITING_SELLER_CONFIRMATION",
        sellerConfirmDeadline: { lte: now },
      },
      include: lifecycleInclude,
      take: 50,
    });

    let count = 0;
    for (const invoice of invoices) {
      await this.prisma.$transaction(async (tx) => {
        await this.cancelPaidInvoice(
          invoice,
          tx,
          now,
          `Penjual tidak merespons dalam ${SELLER_CONFIRM_HOURS} jam`,
        );
      });
      count += 1;
    }

    return count;
  }

  private async autoCompleteDelivered(now: Date): Promise<number> {
    const invoices = await this.prisma.orderInvoice.findMany({
      where: {
        orderStatus: "DELIVERED",
        autoCompleteAt: { lte: now },
        dispute: null,
      },
      include: lifecycleInclude,
      take: 50,
    });

    let count = 0;
    for (const invoice of invoices) {
      await this.prisma.$transaction(async (tx) => {
        await this.releaseInvoice(invoice, tx, now);
      });
      count += 1;
    }

    return count;
  }

  private async releaseInvoice(
    invoice: InvoiceRow,
    tx: Prisma.TransactionClient,
    now: Date,
  ): Promise<void> {
    if (invoice.escrowStatus === "RELEASED") {
      return;
    }

    await this.ledger.releaseEscrow(tx, invoice);
    await tx.orderInvoice.update({
      where: { id: invoice.id },
      data: {
        orderStatus: "COMPLETED",
        escrowStatus: "RELEASED",
        completedAt: now,
      },
    });

    await this.creditWallet(tx, invoice.shopId, invoice.netSellerAmount);
    await this.inventory.commit(tx, invoice.items);

    const quantities = new Map<string, number>();
    for (const item of invoice.items) {
      if (item.productId) {
        quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
      }
    }
    for (const [productId, quantity] of quantities) {
      await tx.product.update({
        where: { id: productId },
        data: { soldCount: { increment: quantity } },
      });
    }

    await this.notifications.send(
      invoice.buyerId,
      "ORDER",
      `Pesanan ${invoice.invoiceNumber} selesai. Uang sudah diteruskan ke penjual. Terima kasih sudah belanja di Bakul.`,
      { invoiceId: invoice.id },
      tx,
    );
    await this.notifications.send(
      invoice.shop.ownerUserId,
      "WITHDRAWAL",
      `Pesanan ${invoice.invoiceNumber} selesai. Saldo Rp ${invoice.netSellerAmount.toLocaleString("id-ID")} masuk ke dompet toko.`,
      { invoiceId: invoice.id },
      tx,
    );
  }

  private async cancelPaidInvoice(
    invoice: InvoiceRow,
    tx: Prisma.TransactionClient,
    now: Date,
    reason: string,
  ): Promise<void> {
    if (invoice.escrowStatus !== "HELD") {
      return;
    }

    await this.ledger.refundEscrow(tx, invoice);
    await tx.orderInvoice.update({
      where: { id: invoice.id },
      data: {
        orderStatus: "CANCELLED_BY_SELLER",
        escrowStatus: "REFUNDED",
        cancelledAt: now,
        completedAt: now,
      },
    });
    await this.inventory.release(tx, invoice.items);

    await this.notifications.send(
      invoice.buyerId,
      "ORDER",
      `Pesanan ${invoice.invoiceNumber} dibatalkan. ${reason}. Uangmu dikembalikan penuh.`,
      { invoiceId: invoice.id },
      tx,
    );
    await this.notifications.send(
      invoice.shop.ownerUserId,
      "ORDER",
      `Pesanan ${invoice.invoiceNumber} dibatalkan otomatis. Stok sudah kembali ke toko.`,
      { invoiceId: invoice.id },
      tx,
    );

    await this.syncPaymentRefunded(tx, invoice.paymentId);
  }

  private async creditWallet(
    tx: Prisma.TransactionClient,
    shopId: string,
    amount: number,
  ): Promise<void> {
    if (amount <= 0) {
      return;
    }

    await tx.shopWallet.upsert({
      where: { shopId },
      update: { balanceAvailable: { increment: amount } },
      create: { shopId, balanceAvailable: amount },
    });
  }

  private async syncPaymentRefunded(
    tx: Prisma.TransactionClient,
    paymentId: string,
  ): Promise<void> {
    const invoices = await tx.orderInvoice.findMany({
      where: { paymentId },
      select: { escrowStatus: true },
    });
    if (invoices.length > 0 && invoices.every((invoice) => invoice.escrowStatus === "REFUNDED")) {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "REFUNDED" },
      });
    }
  }

  private async sellerInvoice(
    tx: Prisma.TransactionClient,
    sellerUserId: string,
    invoiceId: string,
  ): Promise<InvoiceRow> {
    const invoice = await tx.orderInvoice.findFirst({
      where: { id: invoiceId, shop: { ownerUserId: sellerUserId } },
      include: lifecycleInclude,
    });

    if (!invoice) {
      throw new ForbiddenException({
        code: "ORDER_NOT_OWNED",
        message: "Pesanan ini bukan milik tokomu.",
      });
    }

    return invoice;
  }
}
