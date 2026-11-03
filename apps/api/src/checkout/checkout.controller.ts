import { Body, Controller, Headers, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  checkoutQuoteSchema,
  checkoutSchema,
  type CheckoutInput,
  type CheckoutQuote,
  type CheckoutResult,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CheckoutService } from "./checkout.service";

@ApiTags("checkout")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post("quote")
  @ApiOperation({ summary: "Rincian biaya dan pilihan kurir per toko" })
  quote(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(checkoutQuoteSchema)) body: { addressId: string },
  ): Promise<CheckoutQuote> {
    return this.checkout.quote(user.id, body.addressId);
  }

  @Post()
  @ApiOperation({ summary: "Buat tagihan untuk satu atau beberapa toko" })
  create(
    @CurrentUser() user: AuthRequestUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(checkoutSchema)) body: CheckoutInput,
  ): Promise<CheckoutResult> {
    return this.checkout.checkout(user.id, body, idempotencyKey);
  }
}
