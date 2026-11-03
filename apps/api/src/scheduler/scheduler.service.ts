import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ClockService } from "../common/clock/clock.service";
import { OrderLifecycleService } from "../orders/order-lifecycle.service";
import { PaymentsService } from "../payments/payments.service";

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly clock: ClockService,
    private readonly payments: PaymentsService,
    private readonly lifecycle: OrderLifecycleService,
  ) {}

  onModuleInit(): void {
    const tick = Number(process.env["SCHEDULER_TICK_MS"] ?? 5_000);
    this.timer = setInterval(() => {
      void this.tick();
    }, Number.isFinite(tick) && tick >= 1_000 ? tick : 5_000);
    this.timer.unref?.();
    this.logger.log(`Penjadwal lokal hidup, memeriksa setiap ${tick} ms.`);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;

    try {
      const expired = await this.payments.expireDue(this.clock.now());
      const due = await this.lifecycle.processDue();
      if (expired > 0 || due.shipments > 0 || due.cancelled > 0 || due.completed > 0) {
        this.logger.log(
          `Penjadwal: ${expired} tagihan kedaluwarsa, ${due.shipments} resi bergerak, ` +
            `${due.cancelled} batal otomatis, ${due.completed} selesai otomatis.`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Penjadwal gagal: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
