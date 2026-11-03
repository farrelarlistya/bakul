import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  @Get("ping")
  @ApiOperation({ summary: "Cek akses admin" })
  ping(): { ok: true; role: "ADMIN" } {
    return { ok: true, role: "ADMIN" };
  }
}
