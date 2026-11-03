import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from "@nestjs/swagger";
import { sellerShopUpdateSchema, type SellerShopUpdateInput } from "@bakul/shared";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SellerService } from "./seller.service";

@ApiTags("seller")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SELLER")
@Controller("seller")
export class SellerController {
  constructor(private readonly seller: SellerService) {}

  @Get("shop")
  myShop(@CurrentUser() user: AuthRequestUser) {
    return this.seller.myShop(user.id);
  }

  @Patch("shop")
  updateShop(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(sellerShopUpdateSchema))
    body: SellerShopUpdateInput,
  ) {
    return this.seller.updateShop(user.id, body);
  }

  @Post("shop/logo")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { photo: { type: "string", format: "binary" } },
      required: ["photo"],
    },
  })
  @UseInterceptors(FileInterceptor("photo", { limits: { fileSize: 2 * 1024 * 1024 } }))
  setLogo(
    @CurrentUser() user: AuthRequestUser,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.seller.setLogo(user.id, photo);
  }
}
