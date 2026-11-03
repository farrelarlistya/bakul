import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  MIN_WITHDRAWAL,
  type AdminWithdrawalDecisionInput,
  type WalletMutation,
  type WalletSummary,
  type WithdrawalInput,
  type WithdrawalView,
} from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { LedgerService } from "../ledger/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly clock: ClockService,
  ) {}

  async summary(userId: string): Promise<WalletSummary> {
    const shop = await this.shopFor(userId);
    const wallet = await this.prisma.shopWallet.upsert({
      where: { shopId: shop.id },
      update: {},
      create: { shopId: shop.id },
    });

    return {
      shopId: shop.id,
      shopName: shop.name,
      balanceAvailable: wallet.balanceAvailable,
      balanceWithheld: wallet.balanceWithheld,
      bankName: shop.bankName,
      bankAccountNumber: shop.bankAccountNumber,
      bankAccountHolder: shop.bankAccountHolder,
      minWithdrawal: MIN_WITHDRAWAL,
    };
  }

  async mutations(userId: string): Promise<WalletMutation[]> {
    const shop = await this.shopFor(userId);
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { accountCode: `SELLER_PAYABLE:${shop.id}` },
      include: { journal: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return rows.map((row) => ({
      id: row.id,
      description: row.journal.description,
      direction: row.direction,
      amount: row.amount,
      signedAmount: row.direction === "CREDIT" ? row.amount : -row.amount,
      accountCode: row.accountCode,
      refType: row.journal.refType,
      refId: row.journal.refId,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async withdrawals(userId: string): Promise<WithdrawalView[]> {
    const shop = await this.shopFor(userId);
    const rows = await this.prisma.withdrawal.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return rows.map((row) => this.toView(row));
  }

  async request(
    userId: string,
    input: WithdrawalInput,
    idempotencyKey: string | undefined,
  ): Promise<WithdrawalView> {
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{8,100}$/.test(idempotencyKey)) {
      throw new BadRequestException({
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Permintaan tarik saldo tidak lengkap. Muat ulang halaman.",
      });
    }

    const existing = await this.prisma.withdrawal.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      const shop = await this.shopFor(userId);
      if (existing.shopId !== shop.id) {
        throw new ConflictException({
          code: "IDEMPOTENCY_KEY_USED",
          message: "Permintaan ini sudah dipakai.",
        });
      }
      return this.toView(existing);
    }

    const shop = await this.shopFor(userId);
    if (input.amount < MIN_WITHDRAWAL) {
      throw new BadRequestException({
        code: "WITHDRAWAL_MINIMUM",
        message: `Minimum tarik saldo Rp ${MIN_WITHDRAWAL.toLocaleString("id-ID")}.`,
      });
    }

    const wallet = await this.prisma.shopWallet.upsert({
      where: { shopId: shop.id },
      update: {},
      create: { shopId: shop.id },
    });

    if (wallet.balanceAvailable < input.amount) {
      throw new BadRequestException({
        code: "WITHDRAWAL_INSUFFICIENT",
        message: `Saldo siap cair hanya Rp ${wallet.balanceAvailable.toLocaleString("id-ID")}. Kurangi jumlahnya.`,
      });
    }

    try {
      const withdrawal = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.shopWallet.updateMany({
          where: { id: wallet.id, balanceAvailable: { gte: input.amount } },
          data: {
            balanceAvailable: { decrement: input.amount },
            balanceWithheld: { increment: input.amount },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException({
            code: "WITHDRAWAL_INSUFFICIENT",
            message: "Saldo berubah. Muat ulang halaman lalu coba lagi.",
          });
        }

        const created = await tx.withdrawal.create({
          data: {
            shopWalletId: wallet.id,
            shopId: shop.id,
            idempotencyKey,
            amount: input.amount,
            bankName: input.bankName,
            bankAccountNumber: input.bankAccountNumber,
            bankAccountHolder: input.bankAccountHolder,
            status: "REQUESTED",
            requestedAt: this.clock.now(),
            createdAt: this.clock.now(),
          },
        });

        await this.notifications.send(
          userId,
          "WITHDRAWAL",
          `Pengajuan tarik saldo Rp ${input.amount.toLocaleString("id-ID")} sudah masuk. Admin akan memeriksa.`,
          { withdrawalId: created.id },
          tx,
        );

        return created;
      });

      return this.toView(withdrawal);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        const duplicate = await this.prisma.withdrawal.findUnique({
          where: { idempotencyKey },
        });
        if (duplicate) {
          return this.toView(duplicate);
        }
      }
      throw error;
    }
  }

  async listAll(): Promise<WithdrawalView[]> {
    const rows = await this.prisma.withdrawal.findMany({
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return rows.map((row) => this.toView(row, row.shop.name));
  }

  async decide(
    adminId: string,
    withdrawalId: string,
    input: AdminWithdrawalDecisionInput,
  ): Promise<WithdrawalView> {
    const now = this.clock.now();
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { shop: { select: { ownerUserId: true, name: true } } },
    });

    if (!withdrawal) {
      throw new NotFoundException({
        code: "WITHDRAWAL_NOT_FOUND",
        message: "Pengajuan tarik saldo tidak ditemukan.",
      });
    }

    if (withdrawal.status !== "REQUESTED") {
      throw new ConflictException({
        code: "WITHDRAWAL_DONE",
        message: "Pengajuan ini sudah diproses.",
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.withdrawal.updateMany({
        where: { id: withdrawal.id, status: "REQUESTED" },
        data: {
          status: input.action === "APPROVE" ? "COMPLETED" : "REJECTED",
          processedAt: now,
          processedBy: adminId,
          note: input.note ?? null,
          transferProofUrl:
            input.action === "APPROVE"
              ? `/api/v1/withdrawals/${withdrawal.id}/proof`
              : null,
        },
      });

      if (changed.count === 0) {
        throw new ConflictException({
          code: "WITHDRAWAL_DONE",
          message: "Pengajuan ini sudah diproses.",
        });
      }

      if (input.action === "APPROVE") {
        const withheld = await tx.shopWallet.update({
          where: { id: withdrawal.shopWalletId },
          data: { balanceWithheld: { decrement: withdrawal.amount } },
        });
        if (withheld.balanceWithheld < 0) {
          throw new BadRequestException({
            code: "WALLET_WITHHELD_INVALID",
            message: "Saldo tertahan tidak cukup. Periksa data dompet.",
          });
        }

        await this.ledger.recordWithdrawal(tx, {
          id: withdrawal.id,
          shopId: withdrawal.shopId,
          amount: withdrawal.amount,
          bankName: withdrawal.bankName,
          bankAccountNumber: withdrawal.bankAccountNumber,
        });

        await this.notifications.send(
          withdrawal.shop.ownerUserId,
          "WITHDRAWAL",
          `Tarik saldo Rp ${withdrawal.amount.toLocaleString("id-ID")} sudah dicairkan ke ${withdrawal.bankName}.`,
          { withdrawalId: withdrawal.id },
          tx,
        );
      } else {
        await tx.shopWallet.update({
          where: { id: withdrawal.shopWalletId },
          data: {
            balanceWithheld: { decrement: withdrawal.amount },
            balanceAvailable: { increment: withdrawal.amount },
          },
        });
        await this.notifications.send(
          withdrawal.shop.ownerUserId,
          "WITHDRAWAL",
          `Pengajuan tarik saldo Rp ${withdrawal.amount.toLocaleString("id-ID")} ditolak. Saldo kembali ke dompet toko.`,
          { withdrawalId: withdrawal.id },
          tx,
        );
      }

      return tx.withdrawal.findUniqueOrThrow({ where: { id: withdrawal.id } });
    });

    return this.toView(updated, withdrawal.shop.name);
  }

  async proof(userId: string, role: string, withdrawalId: string): Promise<{
    filename: string;
    body: string;
  }> {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { shop: { select: { ownerUserId: true, name: true } } },
    });

    if (!withdrawal) {
      throw new NotFoundException({
        code: "WITHDRAWAL_NOT_FOUND",
        message: "Pengajuan tarik saldo tidak ditemukan.",
      });
    }

    if (role !== "ADMIN" && withdrawal.shop.ownerUserId !== userId) {
      throw new ForbiddenException({
        code: "WITHDRAWAL_FORBIDDEN",
        message: "Bukti ini bukan milikmu.",
      });
    }

    if (withdrawal.status !== "COMPLETED") {
      throw new ConflictException({
        code: "PROOF_NOT_READY",
        message: "Bukti transfer belum tersedia.",
      });
    }

    return {
      filename: `bukti-transfer-${withdrawal.id.slice(0, 8)}.txt`,
      body: [
        "BUKTI TRANSFER SIMULASI — BAKUL",
        "",
        `Toko        : ${withdrawal.shop.name}`,
        `Jumlah      : Rp ${withdrawal.amount.toLocaleString("id-ID")}`,
        `Bank        : ${withdrawal.bankName}`,
        `Rekening    : ${withdrawal.bankAccountNumber}`,
        `Pemilik     : ${withdrawal.bankAccountHolder}`,
        `Waktu       : ${withdrawal.processedAt?.toISOString() ?? "-"}`,
        `Referensi   : ${withdrawal.id}`,
        "",
        "Tidak ada uang nyata yang berpindah. Dokumen ini hanya untuk demo.",
      ].join("\n"),
    };
  }

  private async shopFor(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerUserId: userId },
      select: {
        id: true,
        name: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
      },
    });

    if (!shop) {
      throw new NotFoundException({
        code: "SHOP_NOT_FOUND",
        message: "Kamu belum punya toko.",
      });
    }

    return shop;
  }

  private toView(
    row: {
      id: string;
      amount: number;
      status: string;
      bankName: string;
      bankAccountNumber: string;
      bankAccountHolder: string;
      note: string | null;
      transferProofUrl: string | null;
      requestedAt: Date;
      processedAt: Date | null;
    },
    shopName?: string,
  ): WithdrawalView {
    return {
      id: row.id,
      amount: row.amount,
      status: row.status,
      bankName: row.bankName,
      bankAccountNumber: row.bankAccountNumber,
      bankAccountHolder: row.bankAccountHolder,
      note: row.note,
      transferProofUrl: row.transferProofUrl,
      requestedAt: row.requestedAt.toISOString(),
      processedAt: row.processedAt?.toISOString() ?? null,
      ...(shopName ? { shopName } : {}),
    };
  }
}
