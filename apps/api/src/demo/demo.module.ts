import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";

@Module({
  imports: [PaymentsModule, OrdersModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
