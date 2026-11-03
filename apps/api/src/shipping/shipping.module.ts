import { Controller, Get, Module, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ShippingService } from "./shipping.service";

@ApiTags("tracking")
@Controller("tracking")
export class TrackingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shipping: ShippingService,
  ) {}

  @Get(":awb")
  @ApiOperation({ summary: "Lacak paket dengan nomor resi" })
  async track(@Param("awb") awb: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { awb },
      include: {
        orderInvoice: {
          include: {
            shop: { select: { name: true, cityName: true } },
          },
        },
      },
    });

    if (!shipment) {
      return this.shipping.handleMissingAwb(awb);
    }

    const invoice = shipment.orderInvoice;
    return {
      awb: shipment.awb,
      courierCode: shipment.courierCode,
      courierName: shipment.courierName,
      serviceType: shipment.serviceType,
      status: shipment.shippingStatus,
      invoiceNumber: invoice.invoiceNumber,
      shopName: invoice.shop.name,
      originCity: invoice.shop.cityName,
      destinationCity: invoice.cityName,
      recipientName: invoice.recipientName.split(" ")[0] ?? invoice.recipientName,
      events: this.shipping.asEvents(shipment.trackingHistory),
    };
  }
}

@Module({
  controllers: [TrackingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
