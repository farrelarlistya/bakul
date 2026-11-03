import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  PAYMENT_STATUS_LABEL,
  paymentMethodLabel,
  type PaymentInstruction,
  type PaymentView,
  type WebhookEvent,
} from "@bakul/shared";
import bwipjs from "bwip-js";
import { Prisma } from "../generated/prisma/client";
import { ClockService } from "../common/clock/clock.service";
import { InventoryService } from "../common/inventory/inventory.service";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { MockPgService } from "./mock-pg.service";

type PaymentRow = Prisma.PaymentGetPayload<{
  include: {
    invoices: {
      include: {
        shop: { select: { id: true; name: true; ownerUserId: true } };
        items: true;
      };
    };
  };
}>;

const paymentInclude = {
  invoices: {
    include: {
      shop: { select: { id: true, name: true, ownerUserId: true } },
      items: true,
    },
  },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly ledger: LedgerService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly mockPg: MockPgService,
  ) {}

  async forBuyer(userId: string, paymentId: string): Promise<PaymentView> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, buyerId: userId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Tagihan tidak ditemukan.",
      });
    }

    return this.toView(payment);
  }

  async instructions(userId: string, paymentId: string): Promise<PaymentInstruction> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, buyerId: userId },
    });

    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Tagihan tidak ditemukan.",
      });
    }

    const method = paymentMethodLabel(payment.method);
    const steps =
      payment.method === "QRIS"
        ? [
          "Buka aplikasi dompet digital atau m-banking.",
          "Pilih menu Scan QR.",
          "Pindai kode QRIS di halaman ini.",
          `Periksa nominal Rp ${payment.totalAmount.toLocaleString("id-ID")} lalu bayar.`,
          "Kembali ke Bakul dan tekan “Saya sudah bayar”.",
        ]
        : [
          "Buka aplikasi m-banking atau ATM.",
          "Pilih menu Transfer / Bayar.",
          `Masukkan kode pembayaran ${payment.paymentCode}.`,
          `Periksa nominal Rp ${payment.totalAmount.toLocaleString("id-ID")} lalu bayar.`,
          "Kembali ke Bakul dan tekan “Saya sudah bayar”.",
        ];

    return {
      method: payment.method,
      methodLabel: method,
      paymentCode: payment.paymentCode,
      totalAmount: payment.totalAmount,
      expiresAt: payment.expiresAt.toISOString(),
      serverNow: this.clock.now().toISOString(),
      speed: this.clock.speed(),
      steps,
      qrDataUrl: payment.method === "QRIS" ? await this.qrDataUrl(payment) : null,
      bankName: payment.method === "QRIS" ? null : payment.method.replace("VA_", ""),
    };
  }

  async markPaidFromWebhook(
    payment: PaymentRow,
    tx: Prisma.TransactionClient,
    now: Date,
  ): Promise<boolean> {
    if (payment.status === "PAID") {
      return false;
    }

    if (payment.status !== "PENDING") {
      return false;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: now },
    });

    for (const invoice of payment.invoices) {
      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: {
          orderStatus: "WAITING_SELLER_CONFIRMATION",
          escrowStatus: "HELD",
          paidAt: now,
          sellerConfirmDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        },
      });

      await this.notifications.send(
        payment.buyerId,
        "PAYMENT",
        `Pesanan ${invoice.invoiceNumber} sudah dibayar. Uangnya kami tahan aman sampai barang diterima.`,
        { invoiceNumber: invoice.invoiceNumber, paymentId: payment.id },
        tx,
      );

      await this.notifications.send(
        invoice.shop.ownerUserId,
        "ORDER",
        `Ada pesanan baru ${invoice.invoiceNumber}. Pembayaran sudah aman. Siapkan barang dalam 48 jam.`,
        { invoiceNumber: invoice.invoiceNumber, invoiceId: invoice.id },
        tx,
      );
    }

    await this.ledger.recordPayment(
      tx,
      { id: payment.id, totalAmount: payment.totalAmount },
      payment.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        shopId: invoice.shopId,
      })),
    );

    return true;
  }

  async processWebhook(
    event: WebhookEvent,
    rawBody: string,
    signature: string,
  ): Promise<{ ok: true; duplicate?: boolean; ignored?: boolean }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.webhookEvent.create({
          data: {
            provider: "mock-pg",
            eventId: event.eventId,
            payload: event as unknown as Prisma.InputJsonValue,
            signature,
            status: "RECEIVED",
            receivedAt: this.clock.now(),
          },
        });

        const payment = await tx.payment.findUnique({
          where: { providerRef: event.chargeId },
          include: paymentInclude,
        });

        if (!payment) {
          await tx.webhookEvent.update({
            where: { eventId: event.eventId },
            data: { status: "IGNORED", processedAt: this.clock.now() },
          });
          return { ok: true as const, ignored: true };
        }

        const now = this.clock.now();
        let handled = false;

        if (event.event === "payment.paid") {
          handled = await this.markPaidFromWebhook(payment, tx, now);
        } else if (event.event === "payment.failed") {
          handled = await this.cancelUnpaid(payment, tx, "FAILED", now);
        } else if (event.event === "payment.expired") {
          handled = await this.cancelUnpaid(payment, tx, "EXPIRED", now);
        }

        await tx.webhookEvent.update({
          where: { eventId: event.eventId },
          data: {
            status: handled ? "PROCESSED" : "IGNORED",
            processedAt: now,
          },
        });

        return { ok: true as const, ignored: !handled };
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { ok: true, duplicate: true };
      }
      throw error;
    }
  }

  async expireDue(now: Date): Promise<number> {
    const due = await this.prisma.payment.findMany({
      where: { status: "PENDING", expiresAt: { lte: now } },
      include: paymentInclude,
      take: 50,
    });

    let count = 0;
    for (const payment of due) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const changed = await this.cancelUnpaid(payment, tx, "EXPIRED", now);
          if (changed) {
            count += 1;
          }
        });
      } catch (error: unknown) {
        this.logger.error(
          `Gagal mengakhiri pembayaran ${payment.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return count;
  }

  async expireOne(paymentId: string): Promise<{ ok: true }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Tagihan tidak ditemukan.",
      });
    }

    if (payment.status !== "PENDING") {
      throw new BadRequestException({
        code: "PAYMENT_NOT_PENDING",
        message: `Tagihan sudah ${PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}.`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await this.cancelUnpaid(payment, tx, "EXPIRED", this.clock.now());
    });

    return { ok: true };
  }

  async failOne(paymentId: string): Promise<{ ok: true }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Tagihan tidak ditemukan.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await this.cancelUnpaid(payment, tx, "FAILED", this.clock.now());
    });

    return { ok: true };
  }

  async simulatePay(
    userId: string,
    paymentId: string,
  ): Promise<{ ok: true; eventId: string }> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, buyerId: userId },
      select: { id: true, providerRef: true, totalAmount: true, status: true },
    });

    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Tagihan tidak ditemukan.",
      });
    }

    if (payment.status !== "PENDING") {
      throw new BadRequestException({
        code: "PAYMENT_NOT_PENDING",
        message: "Tagihan ini sudah tidak menunggu pembayaran.",
      });
    }

    const event = this.mockPg.buildEvent("payment.paid", payment, this.clock.now());
    this.mockPg.dispatch(event);
    return { ok: true, eventId: event.eventId };
  }

  verifyWebhook(rawBody: string, signature: string | undefined): WebhookEvent {
    try {
      return this.mockPg.verifyWebhook(rawBody, signature);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({
        code: "WEBHOOK_INVALID",
        message: "Webhook tidak bisa dibaca.",
      });
    }
  }

  private async cancelUnpaid(
    payment: PaymentRow,
    tx: Prisma.TransactionClient,
    status: "EXPIRED" | "FAILED",
    now: Date,
  ): Promise<boolean> {
    if (payment.status !== "PENDING") {
      return false;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    for (const invoice of payment.invoices) {
      await tx.orderInvoice.update({
        where: { id: invoice.id },
        data: {
          orderStatus: "CANCELLED_UNPAID",
          escrowStatus: "CANCELLED",
          cancelledAt: now,
        },
      });
      await this.inventory.release(
        tx,
        invoice.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      );

      await this.notifications.send(
        payment.buyerId,
        "PAYMENT",
        `Pesanan ${invoice.invoiceNumber} batal karena belum dibayar. Stok sudah dikembalikan, jadi barang bisa dipesan lagi.`,
        { invoiceNumber: invoice.invoiceNumber, paymentId: payment.id },
        tx,
      );
      await this.notifications.send(
        invoice.shop.ownerUserId,
        "ORDER",
        `Pesanan ${invoice.invoiceNumber} batal karena pembeli belum membayar. Stok sudah kembali ke toko.`,
        { invoiceNumber: invoice.invoiceNumber, invoiceId: invoice.id },
        tx,
      );
    }

    return true;
  }

  private toView(payment: PaymentRow): PaymentView {
    return {
      id: payment.id,
      status: payment.status,
      method: payment.method,
      methodLabel: paymentMethodLabel(payment.method),
      paymentCode: payment.paymentCode,
      totalAmount: payment.totalAmount,
      expiresAt: payment.expiresAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      invoices: payment.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        shopId: invoice.shop.id,
        shopName: invoice.shop.name,
        totalAmount: invoice.totalAmount,
        orderStatus: invoice.orderStatus,
        escrowStatus: invoice.escrowStatus,
      })),
    };
  }

  private async qrDataUrl(payment: {
    paymentCode: string;
    totalAmount: number;
    id: string;
  }): Promise<string> {
    const payload = this.qrisPayload(payment.paymentCode, payment.totalAmount);
    const png = await bwipjs.toBuffer({
      bcid: "qrcode",
      text: payload,
      scale: 4,
      padding: 8,
      backgroundcolor: "FFFFFF",
    });
    return `data:image/png;base64,${png.toString("base64")}`;
  }

  private qrisPayload(code: string, amount: number): string {
    const tlv = (tag: string, value: string) =>
      `${tag}${String(value.length).padStart(2, "0")}${value}`;
    const merchant = tlv("00", "ID.CO.BAKUL.DEMO") + tlv("01", code) + tlv("02", "01");
    const body =
      tlv("00", "01") +
      tlv("01", "12") +
      tlv("26", merchant) +
      tlv("52", "5812") +
      tlv("53", "360") +
      tlv("54", String(amount)) +
      tlv("58", "ID") +
      tlv("59", "BAKUL DEMO") +
      tlv("60", "YOGYAKARTA") +
      "6304";
    return `${body}${this.crc16(body)}`;
  }

  private crc16(input: string): string {
    let crc = 0xffff;
    for (const character of input) {
      crc ^= character.charCodeAt(0) << 8;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }
}
