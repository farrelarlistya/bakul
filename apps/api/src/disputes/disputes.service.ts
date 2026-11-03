import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DISPUTE_WINDOW_HOURS,
  type AdminDecisionInput,
  type AdminDisputeItem,
  type DisputeInput,
  type DisputeMessageInput,
  type DisputeMessageView,
  type OrderInvoiceView,
} from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { StorageService } from "../common/storage/storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { OrderLifecycleService } from "../orders/order-lifecycle.service";
import { orderInvoiceInclude, toOrderInvoiceView } from "../orders/order-view.mapper";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly lifecycle: OrderLifecycleService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
  ) {}

  async create(
    buyerId: string,
    invoiceId: string,
    input: DisputeInput,
  ): Promise<{ ok: true; disputeId: string }> {
    const now = this.clock.now();
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId },
      include: { shop: { select: { name: true, ownerUserId: true } }, dispute: true },
    });

    if (!invoice) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      });
    }

    if (invoice.orderStatus !== "DELIVERED") {
      throw new ConflictException({
        code: "DISPUTE_NOT_ALLOWED",
        message: "Komplain hanya bisa diajukan setelah paket sampai.",
      });
    }

    if (invoice.dispute) {
      throw new ConflictException({
        code: "DISPUTE_EXISTS",
        message: "Pesanan ini sudah pernah dikomplain.",
      });
    }

    if (
      !invoice.deliveredAt ||
      now.getTime() > invoice.deliveredAt.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000
    ) {
      throw new ConflictException({
        code: "DISPUTE_WINDOW_CLOSED",
        message: `Masa komplain sudah lewat (${DISPUTE_WINDOW_HOURS} jam setelah paket tiba).`,
      });
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          orderInvoiceId: invoice.id,
          buyerId,
          shopId: invoice.shopId,
          reason: input.reason,
          requestedSolution: input.requestedSolution,
          evidenceUrls: (input.evidenceUrls ?? []) as unknown as string[],
          status: "WAITING_SELLER",
          createdAt: now,
          messages: {
            create: {
              senderId: buyerId,
              senderRole: "BUYER",
              body: input.reason,
              createdAt: now,
            },
          },
        },
      });

      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: { orderStatus: "DISPUTED", escrowStatus: "FROZEN" },
      });

      await this.notifications.send(
        invoice.shop.ownerUserId,
        "DISPUTE",
        `Pembeli mengajukan komplain untuk ${invoice.invoiceNumber}. Uang ditahan dulu sampai masalah selesai. Balas dari halaman pesanan.`,
        { invoiceId: invoice.id, disputeId: created.id },
        tx,
      );
      await this.notifications.send(
        buyerId,
        "DISPUTE",
        `Komplain ${invoice.invoiceNumber} sudah dikirim. Uang ditahan aman selama masalah diperiksa.`,
        { invoiceId: invoice.id, disputeId: created.id },
        tx,
      );

      return created;
    });

    return { ok: true, disputeId: dispute.id };
  }

  async addMessage(
    userId: string,
    role: string,
    invoiceId: string,
    input: DisputeMessageInput,
  ): Promise<DisputeMessageView> {
    const invoice = await this.prisma.orderInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        shop: { select: { ownerUserId: true } },
        dispute: { include: { messages: { include: { sender: true } } } },
      },
    });

    if (!invoice?.dispute) {
      throw new NotFoundException({
        code: "DISPUTE_NOT_FOUND",
        message: "Komplain tidak ditemukan.",
      });
    }

    const allowed =
      role === "ADMIN" ||
      invoice.buyerId === userId ||
      invoice.shop.ownerUserId === userId;
    if (!allowed) {
      throw new ForbiddenException({
        code: "DISPUTE_FORBIDDEN",
        message: "Kamu tidak ikut dalam komplain ini.",
      });
    }

    if (["RESOLVED_BUYER", "RESOLVED_SELLER", "CLOSED", "CANCELLED_BY_BUYER"].includes(invoice.dispute.status)) {
      throw new ConflictException({
        code: "DISPUTE_CLOSED",
        message: "Komplain ini sudah selesai.",
      });
    }

    const message = await this.prisma.disputeMessage.create({
      data: {
        disputeId: invoice.dispute.id,
        senderId: userId,
        senderRole: role as "BUYER" | "SELLER" | "ADMIN" | "OPERATOR_DEMO",
        body: input.body,
        createdAt: this.clock.now(),
      },
      include: { sender: { select: { name: true } } },
    });

    const recipient =
      invoice.buyerId === userId ? invoice.shop.ownerUserId : invoice.buyerId;
    await this.notifications.send(
      recipient,
      "DISPUTE",
      `Ada balasan baru di komplain ${invoice.invoiceNumber}.`,
      { invoiceId: invoice.id, disputeId: invoice.dispute.id },
    );

    return {
      id: message.id,
      senderName: message.sender.name,
      senderRole: message.senderRole,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async escalate(buyerId: string, invoiceId: string): Promise<{ ok: true }> {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId },
      include: { dispute: true, shop: { select: { ownerUserId: true } } },
    });

    if (!invoice?.dispute) {
      throw new NotFoundException({
        code: "DISPUTE_NOT_FOUND",
        message: "Komplain tidak ditemukan.",
      });
    }

    if (invoice.dispute.status === "ESCALATED_TO_ADMIN") {
      return { ok: true };
    }

    await this.prisma.dispute.update({
      where: { id: invoice.dispute.id },
      data: { status: "ESCALATED_TO_ADMIN" },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      await this.notifications.send(
        admin.id,
        "DISPUTE",
        `Komplain ${invoice.invoiceNumber} minta diputuskan admin.`,
        { invoiceId: invoice.id, disputeId: invoice.dispute.id },
      );
    }
    await this.notifications.send(
      invoice.shop.ownerUserId,
      "DISPUTE",
      `Pembeli meminta admin memutuskan komplain ${invoice.invoiceNumber}.`,
      { invoiceId: invoice.id, disputeId: invoice.dispute.id },
    );

    return { ok: true };
  }

  async cancel(buyerId: string, invoiceId: string): Promise<{ ok: true }> {
    const now = this.clock.now();
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId },
      include: { dispute: true, shop: { select: { ownerUserId: true } } },
    });

    if (!invoice?.dispute) {
      throw new NotFoundException({
        code: "DISPUTE_NOT_FOUND",
        message: "Komplain tidak ditemukan.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: invoice.dispute!.id },
        data: {
          status: "CANCELLED_BY_BUYER",
          resolvedAt: now,
          decisionNote: "Dibatalkan oleh pembeli.",
        },
      });
      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: {
          orderStatus: "DELIVERED",
          escrowStatus: "HELD",
          autoCompleteAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        },
      });
      await this.notifications.send(
        invoice.shop.ownerUserId,
        "DISPUTE",
        `Pembeli mencabut komplain ${invoice.invoiceNumber}. Uang ditahan aman seperti biasa.`,
        { invoiceId: invoice.id },
        tx,
      );
    });

    return { ok: true };
  }

  async uploadEvidence(
    buyerId: string,
    invoiceId: string,
    file: Express.Multer.File | undefined,
  ): Promise<{ url: string }> {
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, buyerId },
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
        code: "EVIDENCE_REQUIRED",
        message: "Pilih foto atau video bukti dulu.",
      });
    }

    return { url };
  }

  async listForAdmin(): Promise<AdminDisputeItem[]> {
    const rows = await this.prisma.dispute.findMany({
      include: {
        orderInvoice: {
          include: {
            shop: { select: { name: true } },
            buyer: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return rows.map((row) => ({
      id: row.id,
      invoiceId: row.orderInvoiceId,
      invoiceNumber: row.orderInvoice.invoiceNumber,
      shopName: row.orderInvoice.shop.name,
      buyerName: row.orderInvoice.buyer.name,
      totalAmount: row.orderInvoice.totalAmount,
      status: row.status,
      reason: row.reason,
      requestedSolution: row.requestedSolution,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async adminDetail(disputeId: string): Promise<OrderInvoiceView> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { orderInvoiceId: true },
    });
    if (!dispute) {
      throw new NotFoundException({
        code: "DISPUTE_NOT_FOUND",
        message: "Komplain tidak ditemukan.",
      });
    }

    const invoice = await this.prisma.orderInvoice.findUnique({
      where: { id: dispute.orderInvoiceId },
      include: orderInvoiceInclude,
    });
    if (!invoice) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan.",
      });
    }

    return toOrderInvoiceView(invoice, this.clock.now());
  }

  async decide(
    adminId: string,
    disputeId: string,
    input: AdminDecisionInput,
  ): Promise<{ ok: true }> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { orderInvoice: true },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: "DISPUTE_NOT_FOUND",
        message: "Komplain tidak ditemukan.",
      });
    }

    if (["RESOLVED_BUYER", "RESOLVED_SELLER", "CLOSED"].includes(dispute.status)) {
      throw new ConflictException({
        code: "DISPUTE_DONE",
        message: "Komplain ini sudah diputuskan.",
      });
    }

    if (
      input.decision === "REFUND_PARTIAL" &&
      (input.refundAmount === undefined ||
        input.refundAmount >= dispute.orderInvoice.totalAmount)
    ) {
      throw new BadRequestException({
        code: "REFUND_AMOUNT_INVALID",
        message: "Uang kembali sebagian harus lebih kecil dari total pesanan.",
      });
    }

    switch (input.decision) {
      case "RELEASE":
        await this.lifecycle.releaseDisputed(dispute.orderInvoiceId, adminId, input.note);
        break;
      case "REFUND_FULL":
        await this.lifecycle.refundDisputed(
          dispute.orderInvoiceId,
          adminId,
          input.note,
        );
        break;
      case "REFUND_PARTIAL":
        await this.lifecycle.refundDisputed(
          dispute.orderInvoiceId,
          adminId,
          input.note,
          input.refundAmount,
        );
        break;
      case "RETURN":
        await this.lifecycle.markReturning(dispute.orderInvoiceId, adminId, input.note);
        break;
    }

    return { ok: true };
  }

  async markReturned(adminId: string, disputeId: string): Promise<{ ok: true }> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { orderInvoiceId: true, decisionNote: true },
    });
    if (!dispute) {
      throw new NotFoundException({
        code: "DISPUTE_NOT_FOUND",
        message: "Komplain tidak ditemukan.",
      });
    }

    await this.lifecycle.markReturned(
      dispute.orderInvoiceId,
      adminId,
      dispute.decisionNote ?? "Barang sudah kembali ke penjual.",
    );
    return { ok: true };
  }
}
