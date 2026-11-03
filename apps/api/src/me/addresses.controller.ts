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
import {
  addressInputSchema,
  addressUpdateSchema,
  type Address,
  type AddressInput,
  type AddressUpdateInput,
} from "@bakul/shared";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/auth/current-user.decorator";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AddressesService } from "./addresses.service";

@ApiTags("me")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("me/addresses")
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: AuthRequestUser): Promise<Address[]> {
    return this.addresses.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(addressInputSchema)) body: AddressInput,
  ): Promise<Address> {
    return this.addresses.create(user.id, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addressUpdateSchema)) body: AddressUpdateInput,
  ): Promise<Address> {
    return this.addresses.update(user.id, id, body);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.addresses.remove(user.id, id);
  }
}
