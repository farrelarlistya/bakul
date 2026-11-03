import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  withdrawalInputSchema,
  type WalletMutation,
  type WalletSummary,
  type WithdrawalInput,
  type WithdrawalView,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { WalletService } from "./wallet.service";

@ApiTags("wallet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SELLER")
@Controller("wallet")
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @ApiOperation({ summary: "Saldo toko yang siap ditarik" })
  summary(@CurrentUser() user: AuthRequestUser): Promise<WalletSummary> {
    return this.wallet.summary(user.id);
  }

  @Get("mutations")
  @ApiOperation({ summary: "Riwayat saldo masuk dan keluar" })
  mutations(@CurrentUser() user: AuthRequestUser): Promise<WalletMutation[]> {
    return this.wallet.mutations(user.id);
  }
}

@ApiTags("withdrawals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SELLER")
@Controller("withdrawals")
export class WithdrawalsController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  list(@CurrentUser() user: AuthRequestUser): Promise<WithdrawalView[]> {
    return this.wallet.withdrawals(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Ajukan tarik saldo toko" })
  request(
    @CurrentUser() user: AuthRequestUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(withdrawalInputSchema)) body: WithdrawalInput,
  ): Promise<WithdrawalView> {
    return this.wallet.request(user.id, body, idempotencyKey);
  }
}

@ApiTags("withdrawals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("withdrawals")
export class WithdrawalProofController {
  constructor(private readonly wallet: WalletService) {}

  @Get(":id/proof")
  @ApiOperation({ summary: "Unduh bukti transfer simulasi" })
  async proof(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<StreamableFile> {
    const file = await this.wallet.proof(user.id, user.role, id);
    return new StreamableFile(Buffer.from(file.body, "utf8"), {
      type: "text/plain; charset=utf-8",
      disposition: `attachment; filename="${file.filename}"`,
    });
  }
}
