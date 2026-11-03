import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { PaymentInstruction, PaymentView } from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { DemoModeGuard } from "../common/auth/demo-mode.guard";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get(":id")
  @ApiOperation({ summary: "Status tagihan milik pembeli" })
  detail(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<PaymentView> {
    return this.payments.forBuyer(user.id, id);
  }

  @Get(":id/instructions")
  @ApiOperation({ summary: "Cara membayar dan kode pembayaran" })
  instructions(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<PaymentInstruction> {
    return this.payments.instructions(user.id, id);
  }

  @Post(":id/simulate")
  @UseGuards(DemoModeGuard)
  @ApiOperation({ summary: "Simulasikan pembayaran berhasil (mode demo)" })
  simulate(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true; eventId: string }> {
    return this.payments.simulatePay(user.id, id);
  }
}
