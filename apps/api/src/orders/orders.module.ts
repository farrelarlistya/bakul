import { Module } from "@nestjs/common";
import { LedgerModule } from "../ledger/ledger.module";
import { ShippingModule } from "../shipping/shipping.module";
import { OrderLifecycleService } from "./order-lifecycle.service";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [LedgerModule, ShippingModule],
  controllers: [OrdersController],
  providers: [OrderLifecycleService, OrdersService],
  exports: [OrderLifecycleService, OrdersService],
})
export class OrdersModule {}
