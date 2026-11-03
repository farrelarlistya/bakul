import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module";
import { PaymentsModule } from "../payments/payments.module";
import { ShippingModule } from "../shipping/shipping.module";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

@Module({
  imports: [CartModule, ShippingModule, PaymentsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
