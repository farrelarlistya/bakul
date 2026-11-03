import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  reviewInputSchema,
  type OrderInvoiceView,
  type ReviewInput,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Daftar pesanan pembeli" })
  list(
    @CurrentUser() user: AuthRequestUser,
    @Query("status") status?: string,
  ): Promise<OrderInvoiceView[]> {
    return this.orders.list(user.id, status);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detail pesanan pembeli" })
  detail(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<OrderInvoiceView> {
    return this.orders.detail(user.id, id);
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Konfirmasi barang diterima dan lepaskan dana penjual" })
  complete(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.orders.complete(user.id, id);
  }

  @Post(":id/review")
  @ApiOperation({ summary: "Beri rating dan ulasan" })
  review(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(reviewInputSchema)) body: ReviewInput,
  ): Promise<{ ok: true; count: number }> {
    return this.orders.review(user.id, id, body);
  }

  @Post(":id/review/evidence")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { photo: { type: "string", format: "binary" } },
      required: ["photo"],
    },
  })
  @UseInterceptors(FileInterceptor("photo", { limits: { fileSize: 10 * 1024 * 1024 } }))
  reviewEvidence(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<{ url: string }> {
    return this.orders.uploadReviewEvidence(user.id, id, photo);
  }
}
