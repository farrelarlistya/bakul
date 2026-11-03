import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  sellerRejectSchema,
  type OrderInvoiceView,
  type SellerRejectInput,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SellerOrdersService } from "./seller-orders.service";

@ApiTags("seller")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SELLER")
@Controller("seller/orders")
export class SellerOrdersController {
  constructor(private readonly orders: SellerOrdersService) {}

  @Get()
  @ApiOperation({ summary: "Daftar pesanan yang masuk ke toko" })
  list(
    @CurrentUser() user: AuthRequestUser,
    @Query("status") status?: string,
  ): Promise<OrderInvoiceView[]> {
    return this.orders.list(user.id, status);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detail pesanan toko" })
  detail(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<OrderInvoiceView> {
    return this.orders.detail(user.id, id);
  }

  @Post(":id/accept")
  @ApiOperation({ summary: "Terima pesanan dan mulai siapkan barang" })
  accept(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.orders.accept(user.id, id);
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Tolak pesanan dan kembalikan uang pembeli" })
  reject(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sellerRejectSchema)) body: SellerRejectInput,
  ): Promise<{ ok: true }> {
    return this.orders.reject(user.id, id, body);
  }

  @Post(":id/awb")
  @ApiOperation({ summary: "Buat nomor resi mock dan label pengiriman" })
  createAwb(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ awb: string; labelUrl: string }> {
    return this.orders.createAwb(user.id, id);
  }

  @Post(":id/dispute/refund")
  @ApiOperation({ summary: "Setujui pengembalian uang untuk komplain" })
  refundDispute(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.orders.refundDispute(user.id, id);
  }

  @Get(":id/label.pdf")
  @Header("Content-Type", "application/pdf")
  @ApiOperation({ summary: "Unduh label pengiriman A6 dengan barcode" })
  async label(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<StreamableFile> {
    const file = await this.orders.label(user.id, id);
    return new StreamableFile(file.buffer, {
      type: "application/pdf",
      disposition: `attachment; filename="${file.filename}"`,
    });
  }
}
