import {
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("payments")
  @ApiOperation({ summary: "Webhook pembayaran tiruan dengan tanda tangan HMAC" })
  async payment(
    @Req() request: RawBodyRequest<Request>,
    @Headers("x-mock-signature") signature: string | undefined,
  ): Promise<{ ok: true; duplicate?: boolean; ignored?: boolean }> {
    if (!request.rawBody) {
      throw new UnauthorizedException({
        code: "WEBHOOK_RAW_BODY_MISSING",
        message: "Isi webhook tidak bisa dibaca.",
      });
    }

    const rawBody = request.rawBody.toString("utf8");
    const event = this.payments.verifyWebhook(rawBody, signature);
    return this.payments.processWebhook(event, rawBody, signature ?? "");
  }
}
