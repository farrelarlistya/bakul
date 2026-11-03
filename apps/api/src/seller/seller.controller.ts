import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
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
}
