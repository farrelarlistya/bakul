import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  updateProfileSchema,
  type AuthUser,
  type UpdateProfileInput,
} from "@bakul/shared";
import { AuthService } from "../auth/auth.service";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

@ApiTags("me")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("me")
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @ApiOperation({ summary: "Profil pengguna yang sedang masuk" })
  me(@CurrentUser() user: AuthRequestUser): Promise<AuthUser> {
    return this.auth.me(user.id);
  }

  @Patch()
  @ApiOperation({ summary: "Ubah nama atau email opsional" })
  update(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<AuthUser> {
    return this.auth.updateMe(user.id, body);
  }
}
