import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { ShippingModule } from "../shipping/shipping.module";
import { SellerController } from "./seller.controller";
import { SellerEtalasesController } from "./seller-etalases.controller";
import { SellerOrdersController } from "./seller-orders.controller";
import { SellerOrdersService } from "./seller-orders.service";
import { SellerProductsController } from "./seller-products.controller";
import { SellerService } from "./seller.service";
import { SellerProductsService } from "./seller-products.service";

@Module({
  imports: [OrdersModule, ShippingModule],
  controllers: [
    SellerController,
    SellerProductsController,
    SellerEtalasesController,
    SellerOrdersController,
  ],
  providers: [SellerService, SellerProductsService, SellerOrdersService],
})
export class SellerModule {}
