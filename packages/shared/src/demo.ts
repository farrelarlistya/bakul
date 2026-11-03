import { z } from "zod";

export type DemoStatus = {
  demoMode: boolean;
  enabled: boolean;
  now: string;
  speed: number;
  epoch: string;
};

export const demoAdvanceSchema = z.object({
  minutes: z.coerce
    .number()
    .int("Menit harus bilangan bulat.")
    .min(1, "Minimal 1 menit.")
    .max(60 * 24 * 60, "Maksimal 60 hari."),
});

export const demoSpeedSchema = z.object({
  speed: z.coerce
    .number()
    .int("Kecepatan harus bilangan bulat.")
    .min(1, "Minimal 1×.")
    .max(3600, "Maksimal 3600×."),
});

export type DemoSpeedInput = z.infer<typeof demoSpeedSchema>;

export type DemoAdvanceInput = z.infer<typeof demoAdvanceSchema>;

export type DemoPaymentAction = "pay" | "fail" | "expire";

export type ResetResult = {
  ok: true;
  deleted: {
    payments: number;
    invoices: number;
    ledgerJournals: number;
    withdrawals: number;
    disputes: number;
    carts: number;
  };
};
