import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { AdminDisputesController, DisputesController } from "./disputes.controller";
import { DisputesService } from "./disputes.service";

@Module({
  imports: [OrdersModule],
  controllers: [DisputesController, AdminDisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
