import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { DemoStatus } from "@bakul/shared";
import { PrismaService } from "../../prisma/prisma.service";

const EPOCH_KEY = "demo_epoch";
const STARTED_KEY = "demo_started_at";
const SPEED_KEY = "demo_speed";

type DemoState = {
  epoch: Date;
  startedAt: Date;
  speed: number;
};

/**
 * Satu-satunya sumber waktu untuk domain. Saat mode demo aktif, waktu berjalan
 * dipercepat dan dapat dimajukan lewat Demo Console tanpa mengubah kode domain.
 */
@Injectable()
export class ClockService implements OnModuleInit {
  private readonly logger = new Logger(ClockService.name);
  private state: DemoState | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.reload();
  }

  now(): Date {
    if (!this.state) {
      return new Date();
    }

    const elapsedRealMs = Date.now() - this.state.startedAt.getTime();
    return new Date(this.state.epoch.getTime() + elapsedRealMs * this.state.speed);
  }

  isDemo(): boolean {
    return this.state !== null;
  }

  speed(): number {
    return this.state?.speed ?? 1;
  }

  async reload(): Promise<void> {
    const demoMode = process.env["DEMO_MODE"] === "true";
    if (!demoMode) {
      this.state = null;
      return;
    }

    try {
      const rows = await this.prisma.appSetting.findMany({
        where: { key: { in: [EPOCH_KEY, STARTED_KEY, SPEED_KEY] } },
      });
      const map = new Map(rows.map((row) => [row.key, row.value]));
      const epoch = this.readDate(map.get(EPOCH_KEY));
      const startedAt = this.readDate(map.get(STARTED_KEY));
      const speed = this.readNumber(map.get(SPEED_KEY)) ?? Number(process.env["DEMO_SPEED"] ?? 60);

      if (epoch && startedAt) {
        this.state = { epoch, startedAt, speed: speed > 0 ? speed : 1 };
        return;
      }

      const realNow = new Date();
      const initialSpeed = speed > 0 ? speed : 60;
      await this.persist(realNow, realNow, initialSpeed);
      this.state = { epoch: realNow, startedAt: realNow, speed: initialSpeed };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Jam demo belum siap, memakai waktu nyata: ${message}`);
      this.state = null;
    }
  }

  async advance(minutes: number): Promise<DemoStatus> {
    const current = this.now();
    const epoch = new Date(current.getTime() + minutes * 60 * 1000);
    const startedAt = new Date();
    const speed = this.state?.speed ?? Number(process.env["DEMO_SPEED"] ?? 60);
    await this.persist(epoch, startedAt, speed);
    this.state = { epoch, startedAt, speed };
    return this.status();
  }

  async setSpeed(speed: number): Promise<DemoStatus> {
    const current = this.now();
    const startedAt = new Date();
    await this.persist(current, startedAt, speed);
    this.state = { epoch: current, startedAt, speed };
    return this.status();
  }

  status(): DemoStatus {
    return {
      demoMode: process.env["DEMO_MODE"] === "true",
      enabled: this.state !== null,
      now: this.now().toISOString(),
      speed: this.speed(),
      epoch: this.state?.epoch.toISOString() ?? this.now().toISOString(),
    };
  }

  private async persist(epoch: Date, startedAt: Date, speed: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.appSetting.upsert({
        where: { key: EPOCH_KEY },
        update: { value: epoch.toISOString() },
        create: { key: EPOCH_KEY, value: epoch.toISOString() },
      }),
      this.prisma.appSetting.upsert({
        where: { key: STARTED_KEY },
        update: { value: startedAt.toISOString() },
        create: { key: STARTED_KEY, value: startedAt.toISOString() },
      }),
      this.prisma.appSetting.upsert({
        where: { key: SPEED_KEY },
        update: { value: speed },
        create: { key: SPEED_KEY, value: speed },
      }),
    ]);
  }

  private readDate(value: unknown): Date | null {
    if (typeof value !== "string") {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
}
