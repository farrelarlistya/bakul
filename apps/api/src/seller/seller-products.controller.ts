import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Get,
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
import {
  productInputSchema,
  productStatusSchema,
  productUpdateSchema,
  variantInputSchema,
  variantUpdateSchema,
  type ProductInput,
  type ProductStatusValue,
  type ProductUpdateInput,
  type VariantInput,
  type VariantUpdateInput,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SellerProductsService } from "./seller-products.service";

@ApiTags("seller")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SELLER")
@Controller("seller")
export class SellerProductsController {
  constructor(private readonly products: SellerProductsService) {}

  @Get("products")
  list(@CurrentUser() user: AuthRequestUser) {
    return this.products.list(user.id);
  }

  @Post("products")
  create(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(productInputSchema)) body: ProductInput,
  ) {
    return this.products.create(user.id, body);
  }

  @Patch("products/:id")
  update(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(productUpdateSchema)) body: ProductUpdateInput,
  ) {
    return this.products.update(user.id, id, body);
  }

  @Patch("products/:id/status")
  setStatus(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(productStatusSchema))
    body: { status: ProductStatusValue },
  ) {
    return this.products.setStatus(user.id, id, body.status);
  }

  @Post("products/:id/variants")
  addVariant(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(variantInputSchema)) body: VariantInput,
  ) {
    return this.products.addVariant(user.id, id, body);
  }

  @Delete("products/:id/variants/:variantId")
  removeVariant(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Param("variantId") variantId: string,
  ) {
    return this.products.removeVariant(user.id, id, variantId);
  }

  @Patch("products/:id/variants/:variantId")
  updateVariant(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Param("variantId") variantId: string,
    @Body(new ZodValidationPipe(variantUpdateSchema)) body: VariantUpdateInput,
  ) {
    return this.products.updateVariant(user.id, id, variantId, body);
  }

  @Post("products/:id/images")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { photo: { type: "string", format: "binary" } },
      required: ["photo"],
    },
  })
  @UseInterceptors(
    FileInterceptor("photo", {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  addImage(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.products.addImage(user.id, id, photo);
  }
}
