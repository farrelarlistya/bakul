import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  demoAdvanceSchema,
  demoSpeedSchema,
  type DemoAdvanceInput,
  type DemoSpeedInput,
  type DemoStatus,
  type ResetResult,
} from "@bakul/shared";
import { DemoModeGuard } from "../common/auth/demo-mode.guard";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { DemoService } from "./demo.service";

@ApiTags("demo")
@ApiBearerAuth()
@UseGuards(DemoModeGuard, JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "OPERATOR_DEMO")
@Controller("demo")
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Get("status")
  @ApiOperation({ summary: "Waktu simulasi dan kecepatan demo" })
  status(): DemoStatus {
    return this.demo.status();
  }

  @Post("clock/advance")
  @ApiOperation({ summary: "Majukan waktu simulasi" })
  advance(
    @Body(new ZodValidationPipe(demoAdvanceSchema)) body: DemoAdvanceInput,
  ): Promise<DemoStatus> {
    return this.demo.advance(body.minutes);
  }

  @Post("clock/speed")
  @ApiOperation({ summary: "Ubah kecepatan waktu simulasi" })
  speed(
    @Body(new ZodValidationPipe(demoSpeedSchema)) body: DemoSpeedInput,
  ): Promise<DemoStatus> {
    return this.demo.speed(body.speed);
  }

  @Post("tick")
  @ApiOperation({ summary: "Jalankan pemeriksaan SLA dan pengiriman sekarang" })
  tick() {
    return this.demo.tick();
  }

  @Get("payments/pending")
  @ApiOperation({ summary: "Daftar tagihan yang masih menunggu pembayaran" })
  pendingPayments() {
    return this.demo.pendingPayments();
  }

  @Post("payments/:id/pay")
  @ApiOperation({ summary: "Simulasikan pembayaran berhasil" })  pay(@Param("id") id: string) {
    return this.demo.paymentAction(id, "pay");
  }

  @Post("payments/:id/fail")
  @ApiOperation({ summary: "Simulasikan pembayaran gagal" })
  fail(@Param("id") id: string) {
    return this.demo.paymentAction(id, "fail");
  }

  @Post("payments/:id/expire")
  @ApiOperation({ summary: "Simulasikan tagihan kedaluwarsa" })
  expire(@Param("id") id: string) {
    return this.demo.paymentAction(id, "expire");
  }

  @Post("reset")
  @ApiOperation({ summary: "Kosongkan data transaksi demo" })
  reset(): Promise<ResetResult> {
    return this.demo.reset();
  }

  @Post("seed/reset")
  @ApiOperation({ summary: "Alias reset data demo" })
  resetAlias(): Promise<ResetResult> {
    return this.demo.reset();
  }
}
