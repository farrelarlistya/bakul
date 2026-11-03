import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  adminShopStatusSchema,
  adminWithdrawalNoteSchema,
  productStatusSchema,
  type AdminMetrics,
  type AdminProductRow,
  type AdminShopRow,
  type AdminShopStatusInput,
  type AdminWithdrawalNoteInput,
  type ProductStatusValue,
  type WithdrawalView,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { WalletService } from "../wallet/wallet.service";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly wallet: WalletService,
  ) {}

  @Get("ping")
  @ApiOperation({ summary: "Cek akses admin" })
  ping(): { ok: true; role: "ADMIN" } {
    return { ok: true, role: "ADMIN" };
  }

  @Get("metrics")
  @ApiOperation({ summary: "Ringkasan GMV, dana ditahan, pesanan, dan antrean" })
  metrics(): Promise<AdminMetrics> {
    return this.admin.metrics();
  }

  @Get("shops")
  shops(): Promise<AdminShopRow[]> {
    return this.admin.shops();
  }

  @Get("products")
  products(@Query("q") query?: string): Promise<AdminProductRow[]> {
    return this.admin.products(query);
  }

  @Patch("shops/:id/status")
  setShopStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminShopStatusSchema)) body: AdminShopStatusInput,
  ): Promise<{ ok: true; status: string }> {
    return this.admin.setShopStatus(id, body);
  }

  @Patch("products/:id/status")
  setProductStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(productStatusSchema)) body: { status: ProductStatusValue },
  ): Promise<{ ok: true; status: string }> {
    return this.admin.setProductStatus(id, body.status);
  }

  @Get("withdrawals")
  withdrawals(): Promise<WithdrawalView[]> {
    return this.wallet.listAll();
  }

  @Post("withdrawals/:id/approve")
  approveWithdrawal(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminWithdrawalNoteSchema))
    body: AdminWithdrawalNoteInput,
  ): Promise<WithdrawalView> {
    return this.wallet.decide(user.id, id, { action: "APPROVE", note: body.note });
  }

  @Post("withdrawals/:id/reject")
  rejectWithdrawal(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminWithdrawalNoteSchema))
    body: AdminWithdrawalNoteInput,
  ): Promise<WithdrawalView> {
    return this.wallet.decide(user.id, id, { action: "REJECT", note: body.note });
  }
}
