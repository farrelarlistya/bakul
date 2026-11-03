import { Controller, Get } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";
import { HealthService } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Cek API dan koneksi PostgreSQL" })
  @ApiOkResponse({
    description: "API dan database siap.",
    schema: {
      example: {
        status: "ok",
        service: "bakul-api",
        database: "up",
        version: "0.1.0",
        checkedAt: "2026-11-03T08:00:00.000Z",
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: "Database belum tersambung.",
    schema: {
      example: {
        status: "error",
        service: "bakul-api",
        database: "down",
        version: "0.1.0",
        checkedAt: "2026-11-03T08:00:00.000Z",
        message: "Database belum siap. Jalankan PostgreSQL lalu coba lagi.",
      },
    },
  })
  check() {
    return this.health.check();
  }
}
