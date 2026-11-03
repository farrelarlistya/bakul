import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { DemoPaymentAction, DemoStatus, ResetResult } from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { OrderLifecycleService } from "../orders/order-lifecycle.service";
import { MockPgService } from "../payments/mock-pg.service";
import { PaymentsService } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly mockPg: MockPgService,
    private readonly payments: PaymentsService,
    private readonly lifecycle: OrderLifecycleService,
  ) {}

  status(): DemoStatus {
    return this.clock.status();
  }

  async advance(minutes: number): Promise<DemoStatus> {
    const status = await this.clock.advance(minutes);
    await this.tick();
    return status;
  }

  speed(speed: number): Promise<DemoStatus> {
    return this.clock.setSpeed(speed);
  }

  async tick(): Promise<{ expired: number; shipments: number; cancelled: number; completed: number }> {
    const expired = await this.payments.expireDue(this.clock.now());
    const due = await this.lifecycle.processDue();
    return { expired, ...due };
  }

  async paymentAction(paymentId: string, action: DemoPaymentAction): Promise<{
    ok: true;
    eventId: string;
    event: string;
  }> {    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { providerRef: true, totalAmount: true, status: true },
    });

    if (!payment) {
      throw new NotFoundException({
        code: "PAYMENT_NOT_FOUND",
        message: "Tagihan tidak ditemukan.",
      });
    }

    const eventName =
      action === "pay"
        ? "payment.paid"
        : action === "fail"
          ? "payment.failed"
          : "payment.expired";
    const event = this.mockPg.buildEvent(eventName, payment, this.clock.now());
    this.mockPg.dispatch(event);
    return { ok: true, eventId: event.eventId, event: eventName };
  }

  async pendingPayments() {
    const rows = await this.prisma.payment.findMany({
      where: { status: "PENDING" },
      include: {
        buyer: { select: { name: true, phone: true } },
        invoices: { include: { shop: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return rows.map((row) => ({
      id: row.id,
      paymentCode: row.paymentCode,
      method: row.method,
      totalAmount: row.totalAmount,
      status: row.status,
      expiresAt: row.expiresAt.toISOString(),
      buyerName: row.buyer.name,
      shops: row.invoices.map((invoice) => invoice.shop.name),
    }));
  }

  async reset(): Promise<ResetResult> {
    const [
      payments,
      invoices,
      ledgerJournals,
      withdrawals,
      disputes,
      carts,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.orderInvoice.count(),
      this.prisma.ledgerJournal.count(),
      this.prisma.withdrawal.count(),
      this.prisma.dispute.count(),
      this.prisma.cart.count(),
    ]);

    await this.prisma.$executeRaw`
      TRUNCATE TABLE
        "webhook_events",
        "ledger_entries",
        "ledger_journals",
        "withdrawals",
        "shop_wallets",
        "dispute_messages",
        "disputes",
        "shipments",
        "order_items",
        "order_invoices",
        "payments",
        "cart_items",
        "carts"
      CASCADE
    `;
    await this.prisma.notification.deleteMany({});
    await this.prisma.otpCode.deleteMany({});
    await this.prisma.appSetting.deleteMany({
      where: { key: { in: ["demo_epoch", "demo_started_at"] } },
    });
    await this.clock.reload();

    this.logger.warn("Data transaksi demo dikosongkan lewat Demo Console.");

    return {
      ok: true,
      deleted: {
        payments,
        invoices,
        ledgerJournals,
        withdrawals,
        disputes,
        carts,
      },
    };
  }
}
