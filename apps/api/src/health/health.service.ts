import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { HealthResponse } from "@bakul/shared";
import { PrismaService } from "../prisma/prisma.service";

const API_VERSION = "0.1.0";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    const checkedAt = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: "ok",
        service: "bakul-api",
        database: "up",
        version: API_VERSION,
        checkedAt,
      };
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        service: "bakul-api",
        database: "down",
        version: API_VERSION,
        checkedAt,
        message: "Database belum siap. Jalankan PostgreSQL lalu coba lagi.",
      });
    }
  }
}
