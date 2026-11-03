import { BadRequestException, Injectable } from "@nestjs/common";
import { LEDGER_ACCOUNTS } from "@bakul/shared";
import { ClockService } from "../common/clock/clock.service";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type LedgerLine = {
  accountCode: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  shopId?: string | null;
};

export type JournalInput = {
  refType: string;
  refId: string;
  description: string;
  lines: LedgerLine[];
};

export type LedgerCheckResult = {
  balanced: boolean;
  journalCount: number;
  entryCount: number;
  unbalancedJournals: number;
  walletMismatches: { shopId: string; wallet: number; ledger: number }[];
  escrowLedger: number;
  escrowInvoices: number;
  escrowMatches: boolean;
  negativeEntries: number;
  appendOnlyWorks: boolean;
  totalDebit: number;
  totalCredit: number;
};

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: ClockService,
  ) {}

  async post(tx: Prisma.TransactionClient, input: JournalInput) {
    if (input.lines.length < 2) {
      throw new BadRequestException({
        code: "LEDGER_MIN_LINES",
        message: "Jurnal harus punya minimal dua baris.",
      });
    }

    let debit = 0;
    let credit = 0;
    for (const line of input.lines) {
      if (!Number.isInteger(line.amount) || line.amount <= 0) {
        throw new BadRequestException({
          code: "LEDGER_AMOUNT_INVALID",
          message: "Nominal jurnal harus rupiah bulat dan lebih dari nol.",
        });
      }
      if (line.direction === "DEBIT") {
        debit += line.amount;
      } else {
        credit += line.amount;
      }
    }

    if (debit !== credit) {
      throw new BadRequestException({
        code: "LEDGER_UNBALANCED",
        message: `Jurnal tidak seimbang: debit ${debit}, kredit ${credit}.`,
      });
    }

    return tx.ledgerJournal.create({
      data: {
        refType: input.refType,
        refId: input.refId,
        description: input.description,
        createdAt: this.clock.now(),
        entries: {
          create: input.lines.map((line) => ({
            accountCode: line.accountCode,
            direction: line.direction,
            amount: line.amount,
            shopId: line.shopId ?? null,
          })),
        },
      },
    });
  }

  async recordPayment(
    tx: Prisma.TransactionClient,
    payment: { id: string; totalAmount: number },
    invoices: { id: string; invoiceNumber: string; totalAmount: number; shopId: string }[],
  ): Promise<void> {
    for (const invoice of invoices) {
      await this.post(tx, {
        refType: "PAYMENT",
        refId: `${payment.id}:${invoice.id}`,
        description: `Uang diterima untuk ${invoice.invoiceNumber}`,
        lines: [
          {
            accountCode: LEDGER_ACCOUNTS.CASH,
            direction: "DEBIT",
            amount: invoice.totalAmount,
          },
          {
            accountCode: LEDGER_ACCOUNTS.ESCROW,
            direction: "CREDIT",
            amount: invoice.totalAmount,
            shopId: invoice.shopId,
          },
        ],
      });
    }

    const pgFee = Math.round(payment.totalAmount * 0.007);
    if (pgFee > 0) {
      await this.post(tx, {
        refType: "PG_FEE",
        refId: payment.id,
        description: "Biaya layanan pembayaran (disubsidi platform)",
        lines: [
          {
            accountCode: LEDGER_ACCOUNTS.PG_FEE,
            direction: "DEBIT",
            amount: pgFee,
          },
          {
            accountCode: LEDGER_ACCOUNTS.CASH,
            direction: "CREDIT",
            amount: pgFee,
          },
        ],
      });
    }
  }

  async releaseEscrow(
    tx: Prisma.TransactionClient,
    invoice: {
      id: string;
      invoiceNumber: string;
      shopId: string;
      totalAmount: number;
      netSellerAmount: number;
      platformFee: number;
      serviceFee: number;
    },
  ): Promise<void> {
    await this.post(tx, {
      refType: "ESCROW_RELEASE",
      refId: invoice.id,
      description: `Pesanan ${invoice.invoiceNumber} selesai`,
      lines: [
        {
          accountCode: LEDGER_ACCOUNTS.ESCROW,
          direction: "DEBIT",
          amount: invoice.totalAmount,
          shopId: invoice.shopId,
        },
        {
          accountCode: LEDGER_ACCOUNTS.sellerPayable(invoice.shopId),
          direction: "CREDIT",
          amount: invoice.netSellerAmount,
          shopId: invoice.shopId,
        },
        {
          accountCode: LEDGER_ACCOUNTS.PLATFORM_REVENUE,
          direction: "CREDIT",
          amount: invoice.platformFee + invoice.serviceFee,
        },
      ],
    });
  }

  async refundEscrow(
    tx: Prisma.TransactionClient,
    invoice: { id: string; invoiceNumber: string; shopId: string; totalAmount: number },
  ): Promise<void> {
    await this.post(tx, {
      refType: "ESCROW_REFUND",
      refId: invoice.id,
      description: `Uang pesanan ${invoice.invoiceNumber} dikembalikan`,
      lines: [
        {
          accountCode: LEDGER_ACCOUNTS.ESCROW,
          direction: "DEBIT",
          amount: invoice.totalAmount,
          shopId: invoice.shopId,
        },
        {
          accountCode: LEDGER_ACCOUNTS.CASH,
          direction: "CREDIT",
          amount: invoice.totalAmount,
        },
      ],
    });
  }

  async partialRefund(
    tx: Prisma.TransactionClient,
    invoice: {
      id: string;
      invoiceNumber: string;
      shopId: string;
      totalAmount: number;
      netSellerAmount: number;
    },
    refundAmount: number,
  ): Promise<{ sellerAmount: number; revenue: number }> {
    const remaining = invoice.totalAmount - refundAmount;
    const sellerAmount = Math.min(invoice.netSellerAmount, Math.max(0, remaining));
    const revenue = remaining - sellerAmount;

    if (refundAmount <= 0 || remaining < 0) {
      throw new BadRequestException({
        code: "REFUND_AMOUNT_INVALID",
        message: "Jumlah pengembalian uang tidak masuk akal.",
      });
    }

    const lines: LedgerLine[] = [
      {
        accountCode: LEDGER_ACCOUNTS.ESCROW,
        direction: "DEBIT",
        amount: invoice.totalAmount,
        shopId: invoice.shopId,
      },
      {
        accountCode: LEDGER_ACCOUNTS.CASH,
        direction: "CREDIT",
        amount: refundAmount,
      },
    ];

    if (sellerAmount > 0) {
      lines.push({
        accountCode: LEDGER_ACCOUNTS.sellerPayable(invoice.shopId),
        direction: "CREDIT",
        amount: sellerAmount,
        shopId: invoice.shopId,
      });
    }
    if (revenue > 0) {
      lines.push({
        accountCode: LEDGER_ACCOUNTS.PLATFORM_REVENUE,
        direction: "CREDIT",
        amount: revenue,
      });
    }

    await this.post(tx, {
      refType: "ESCROW_PARTIAL_REFUND",
      refId: invoice.id,
      description: `Sebagian uang ${invoice.invoiceNumber} dikembalikan`,
      lines,
    });

    return { sellerAmount, revenue };
  }

  async recordWithdrawal(
    tx: Prisma.TransactionClient,
    withdrawal: {
      id: string;
      shopId: string;
      amount: number;
      bankName: string;
      bankAccountNumber: string;
    },
  ): Promise<void> {
    await this.post(tx, {
      refType: "WITHDRAWAL",
      refId: withdrawal.id,
      description: `Tarik saldo ke ${withdrawal.bankName} ${withdrawal.bankAccountNumber}`,
      lines: [
        {
          accountCode: LEDGER_ACCOUNTS.sellerPayable(withdrawal.shopId),
          direction: "DEBIT",
          amount: withdrawal.amount,
          shopId: withdrawal.shopId,
        },
        {
          accountCode: LEDGER_ACCOUNTS.CASH,
          direction: "CREDIT",
          amount: withdrawal.amount,
        },
      ],
    });
  }

  async check(): Promise<LedgerCheckResult> {
    const journals = await this.prisma.ledgerJournal.findMany({
      include: { entries: true },
    });

    let unbalancedJournals = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let negativeEntries = 0;

    for (const journal of journals) {
      let debit = 0;
      let credit = 0;
      for (const entry of journal.entries) {
        if (entry.amount <= 0) {
          negativeEntries += 1;
        }
        if (entry.direction === "DEBIT") {
          debit += entry.amount;
          totalDebit += entry.amount;
        } else {
          credit += entry.amount;
          totalCredit += entry.amount;
        }
      }
      if (debit !== credit) {
        unbalancedJournals += 1;
      }
    }

    const wallets = await this.prisma.shopWallet.findMany();
    const walletMismatches: { shopId: string; wallet: number; ledger: number }[] = [];

    for (const wallet of wallets) {
      const ledger = await this.sellerBalance(wallet.shopId);
      const cached = wallet.balanceAvailable + wallet.balanceWithheld;
      if (ledger !== cached) {
        walletMismatches.push({
          shopId: wallet.shopId,
          wallet: cached,
          ledger,
        });
      }
    }

    const escrowEntries = await this.prisma.ledgerEntry.findMany({
      where: { accountCode: LEDGER_ACCOUNTS.ESCROW },
    });
    const escrowLedger = escrowEntries.reduce(
      (total, entry) =>
        total + (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0,
    );

    const activeEscrow = await this.prisma.orderInvoice.aggregate({
      where: { escrowStatus: { in: ["HELD", "FROZEN"] } },
      _sum: { totalAmount: true },
    });
    const escrowInvoices = activeEscrow._sum.totalAmount ?? 0;

    let appendOnlyWorks = false;
    const first = await this.prisma.ledgerEntry.findFirst({ select: { id: true } });
    if (first) {
      try {
        await this.prisma.$executeRaw`UPDATE "ledger_entries" SET "amount" = "amount" WHERE "id" = ${first.id}::uuid`;
      } catch {
        appendOnlyWorks = true;
      }
    }

    return {
      balanced:
        unbalancedJournals === 0 &&
        totalDebit === totalCredit &&
        negativeEntries === 0,
      journalCount: journals.length,
      entryCount: journals.reduce((total, journal) => total + journal.entries.length, 0),
      unbalancedJournals,
      walletMismatches,
      escrowLedger,
      escrowInvoices,
      escrowMatches: escrowLedger === escrowInvoices,
      negativeEntries,
      appendOnlyWorks,
      totalDebit,
      totalCredit,
    };
  }

  async sellerBalance(shopId: string): Promise<number> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { accountCode: LEDGER_ACCOUNTS.sellerPayable(shopId) },
    });

    return entries.reduce(
      (total, entry) =>
        total + (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0,
    );
  }
}
