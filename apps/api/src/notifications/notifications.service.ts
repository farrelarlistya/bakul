import { Injectable, NotFoundException } from "@nestjs/common";
import type { NotificationItem } from "@bakul/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
