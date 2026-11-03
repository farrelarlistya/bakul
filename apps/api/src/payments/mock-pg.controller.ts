import { Controller, Get, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DemoModeGuard } from "../common/auth/demo-mode.guard";
import { ClockService } from "../common/clock/clock.service";
import { PrismaService } from "../prisma/prisma.service";
import { MockPgService } from "./mock-pg.service";

@ApiTags("mock-pg")
@UseGuards(DemoModeGuard)
@Controller("mock-pg")
export class MockPgController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockPg: MockPgService,
    private readonly clock: ClockService,
  ) {}

  @Get("charges/:ref")
  @ApiOperation({ summary: "Lihat tagihan mock berdasarkan provider ref" })
  async charge(@Param("ref") ref: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerRef: ref },
      select: {
        id: true,
        providerRef: true,
        paymentCode: true,
        method: true,
        totalAmount: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException({
        code: "CHARGE_NOT_FOUND",
        message: "Tagihan mock tidak ditemukan.",
      });
    }

    return payment;
  }

  @Post("charges/:ref/pay")
  @ApiOperation({ summary: "Simulasikan pembayaran berhasil" })
  pay(@Param("ref") ref: string) {
    return this.action(ref, "payment.paid");
  }

  @Post("charges/:ref/fail")
  @ApiOperation({ summary: "Simulasikan pembayaran gagal" })
  fail(@Param("ref") ref: string) {
    return this.action(ref, "payment.failed");
  }

  @Post("charges/:ref/expire")
  @ApiOperation({ summary: "Paksa tagihan kedaluwarsa" })
  expire(@Param("ref") ref: string) {
    return this.action(ref, "payment.expired");
  }

  private async action(ref: string, eventName: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerRef: ref },
      select: { providerRef: true, totalAmount: true, status: true },
    });

    if (!payment) {
      throw new NotFoundException({
        code: "CHARGE_NOT_FOUND",
        message: "Tagihan mock tidak ditemukan.",
      });
    }

    if (payment.status !== "PENDING" && eventName === "payment.paid") {
      return { ok: true, ignored: true, status: payment.status };
    }

    const event = this.mockPg.buildEvent(eventName, payment, this.clock.now());
    this.mockPg.dispatch(event);
    return { ok: true, eventId: event.eventId, event: eventName };
  }
}
