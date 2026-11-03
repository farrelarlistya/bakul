import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [PaymentsModule, OrdersModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
