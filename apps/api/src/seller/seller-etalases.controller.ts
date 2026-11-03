import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { etalaseInputSchema, type EtalaseInput } from "@bakul/shared";
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
@Controller("seller/etalases")
export class SellerEtalasesController {
  constructor(private readonly products: SellerProductsService) {}

  @Get()
  list(@CurrentUser() user: AuthRequestUser) {
    return this.products.listEtalases(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(etalaseInputSchema)) body: EtalaseInput,
  ) {
    return this.products.createEtalase(user.id, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(etalaseInputSchema)) body: EtalaseInput,
  ) {
    return this.products.updateEtalase(user.id, id, body);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.products.deleteEtalase(user.id, id);
  }
}
