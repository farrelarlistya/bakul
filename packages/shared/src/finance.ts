import { z } from "zod";

export const MIN_WITHDRAWAL = 50_000;

export const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Menunggu diperiksa",
  APPROVED: "Disetujui",
  PROCESSING: "Sedang diproses",
  COMPLETED: "Sudah dicairkan",
  REJECTED: "Ditolak",
};

export type WalletSummary = {
  shopId: string;
  shopName: string;
  balanceAvailable: number;
  balanceWithheld: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  minWithdrawal: number;
};

export type WalletMutation = {
  id: string;
  description: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  signedAmount: number;
  accountCode: string;
  refType: string;
  refId: string;
  createdAt: string;
};

export type WithdrawalView = {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  note: string | null;
  transferProofUrl: string | null;
  requestedAt: string;
  processedAt: string | null;
  shopName?: string;
};

export const withdrawalInputSchema = z.object({
  amount: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat.")
    .min(MIN_WITHDRAWAL, `Minimum tarik saldo Rp ${MIN_WITHDRAWAL.toLocaleString("id-ID")}.`)
    .max(1_000_000_000),
  bankName: z.string().trim().min(2, "Isi nama bank.").max(60),
  bankAccountNumber: z
    .string()
    .trim()
    .min(4, "Isi nomor rekening.")
    .max(40)
    .regex(/^[0-9]+$/, "Nomor rekening hanya angka."),
  bankAccountHolder: z.string().trim().min(2, "Isi nama pemilik rekening.").max(120),
});

export type WithdrawalInput = z.infer<typeof withdrawalInputSchema>;

export const LEDGER_ACCOUNTS = {
  CASH: "CASH",
  ESCROW: "ESCROW_LIABILITY",
  PLATFORM_REVENUE: "PLATFORM_REVENUE",
  PG_FEE: "PG_FEE_EXPENSE",
  sellerPayable: (shopId: string) => `SELLER_PAYABLE:${shopId}`,
} as const;
