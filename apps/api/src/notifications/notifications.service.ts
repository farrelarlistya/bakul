import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { NotificationItem } from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
  ) {}

  async list(userId: string): Promise<NotificationItem[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return rows.map((row) => ({
      id: row.id,
      template: row.template,
      payload:
        row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
          ? (row.payload as Record<string, unknown>)
          : {},
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async markRead(userId: string, notificationId: string): Promise<{ ok: true }> {
    const updated = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      throw new NotFoundException({
        code: "NOTIFICATION_NOT_FOUND",
        message: "Pesan tidak ditemukan.",
      });
    }

    return { ok: true };
  }

  async send(
    userId: string,
    template: string,
    message: string,
    extra: Record<string, unknown> = {},
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.notification.create({
      data: {
        userId,
        template,
        payload: { message, ...extra },
        createdAt: this.clock.now(),
      },
    });
    this.logger.log(`[NOTIF] IN_APP ${userId} ${template}`);
  }
}
