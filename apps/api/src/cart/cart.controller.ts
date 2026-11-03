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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  addCartItemSchema,
  updateCartItemSchema,
  type AddCartItemInput,
  type CartView,
  type UpdateCartItemInput,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CartService } from "./cart.service";

@ApiTags("cart")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: "Isi keranjang dikelompokkan per toko" })
  view(@CurrentUser() user: AuthRequestUser): Promise<CartView> {
    return this.cart.view(user.id);
  }

  @Post("items")
  @ApiOperation({ summary: "Tambah barang ke keranjang" })
  add(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(addCartItemSchema)) body: AddCartItemInput,
  ): Promise<CartView> {
    return this.cart.add(user.id, body);
  }

  @Patch("items/:id")
  @ApiOperation({ summary: "Ubah jumlah atau pilihan barang di keranjang" })
  update(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) body: UpdateCartItemInput,
  ): Promise<CartView> {
    return this.cart.update(user.id, id, body);
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Buang barang dari keranjang" })
  remove(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<CartView> {
    return this.cart.remove(user.id, id);
  }
}
