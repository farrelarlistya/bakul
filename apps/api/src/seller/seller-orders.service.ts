import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ORDER_STATUS_VALUES,
  type OrderInvoiceView,
  type SellerRejectInput,
} from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { PrismaService } from "../prisma/prisma.service";
import { OrderLifecycleService } from "../orders/order-lifecycle.service";
import { orderInvoiceInclude, toOrderInvoiceView } from "../orders/order-view.mapper";
import { ShippingService } from "../shipping/shipping.service";

@Injectable()
export class SellerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
    private readonly lifecycle: OrderLifecycleService,
    private readonly shipping: ShippingService,
  ) {}

  async list(userId: string, status?: string): Promise<OrderInvoiceView[]> {
    const shop = await this.shopFor(userId);
    const validStatus =
      status && (ORDER_STATUS_VALUES as readonly string[]).includes(status)
        ? status
        : undefined;

    const rows = await this.prisma.orderInvoice.findMany({
      where: {
        shopId: shop.id,
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
    const shop = await this.shopFor(userId);
    const row = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, shopId: shop.id },
      include: orderInvoiceInclude,
    });

    if (!row) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan di tokomu.",
      });
    }

    return toOrderInvoiceView(row, this.clock.now());
  }

  accept(userId: string, invoiceId: string): Promise<{ ok: true }> {
    return this.lifecycle.acceptInvoice(userId, invoiceId);
  }

  reject(
    userId: string,
    invoiceId: string,
    input: SellerRejectInput,
  ): Promise<{ ok: true }> {
    return this.lifecycle.rejectInvoice(userId, invoiceId, input.reason);
  }

  async createAwb(
    userId: string,
    invoiceId: string,
  ): Promise<{ awb: string; labelUrl: string }> {
    const result = await this.lifecycle.createShipment(userId, invoiceId);
    return result;
  }

  refundDispute(userId: string, invoiceId: string): Promise<{ ok: true }> {
    return this.lifecycle.processSellerRefund(invoiceId, userId);
  }

  async label(userId: string, invoiceId: string): Promise<{ buffer: Buffer; filename: string }> {
    const shop = await this.shopFor(userId);
    const invoice = await this.prisma.orderInvoice.findFirst({
      where: { id: invoiceId, shopId: shop.id },
      include: {
        shop: { include: { owner: { select: { phone: true } } } },
        items: true,
        shipment: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        message: "Pesanan tidak ditemukan di tokomu.",
      });
    }

    if (!invoice.shipment) {
      throw new ConflictException({
        code: "SHIPMENT_NOT_READY",
        message: "Buat nomor resi dulu sebelum mencetak label.",
      });
    }

    const buffer = await this.shipping.labelPdf({
      awb: invoice.shipment.awb,
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
    });

    return { buffer, filename: `label-${invoice.shipment.awb}.pdf` };
  }

  private async shopFor(userId: string): Promise<{ id: string }> {
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

    return shop;
  }
}
