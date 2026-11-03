import { describe, expect, it } from "vitest";
import { checkoutSchema } from "../src/commerce";
import {
  adminDecisionSchema,
  disputeInputSchema,
  disputeMessageSchema,
  reviewInputSchema,
} from "../src/orders";
import { calculateTotals, sumOrderTotals } from "../src/fees";
import { withdrawalInputSchema } from "../src/finance";

const uuid = "6f1c2a9e-6f1e-4f6e-9f6e-6f1e6f1e6f1e";

describe("hitungan uang pesanan", () => {
  it("mengikuti contoh PRD Bab 11.3", () => {
    const totals = calculateTotals({ subtotalItems: 100_000, shippingCost: 10_000 });
    expect(totals.serviceFee).toBe(1_770);
    expect(totals.platformFee).toBe(2_000);
    expect(totals.netSellerAmount).toBe(108_000);
    expect(totals.totalAmount).toBe(111_770);
  });

  it("menjumlahkan beberapa toko dengan biaya layanan per toko", () => {
    const total = sumOrderTotals([
      { subtotalItems: 100_000, shippingCost: 10_000 },
      { subtotalItems: 50_000, shippingCost: 9_000 },
    ]);
    expect(total.totalAmount).toBe(111_770 + 59_000 + 1_413);
    expect(total.serviceFee).toBe(1_770 + 1_413);
  });
});

describe("validasi transaksi", () => {
  it("mewajibkan kurir untuk setiap toko", () => {
    expect(
      checkoutSchema.safeParse({
        addressId: uuid,
        paymentMethod: "VA_BCA",
        shipping: [],
      }).success,
    ).toBe(false);
  });

  it("menolak metode bayar yang tidak dikenal", () => {
    expect(
      checkoutSchema.safeParse({
        addressId: uuid,
        paymentMethod: "CASH",
        shipping: [{ shopId: uuid, courier: "JNE", service: "REG" }],
      }).success,
    ).toBe(false);
  });

  it("meminta jumlah refund pada refund sebagian", () => {
    expect(
      adminDecisionSchema.safeParse({
        decision: "REFUND_PARTIAL",
        note: "Barang kurang satu.",
      }).success,
    ).toBe(false);
    expect(
      adminDecisionSchema.safeParse({
        decision: "REFUND_PARTIAL",
        refundAmount: 25_000,
        note: "Barang kurang satu.",
      }).success,
    ).toBe(true);
  });

  it("membatasi tarik saldo minimal Rp50.000", () => {
    expect(
      withdrawalInputSchema.safeParse({
        amount: 49_999,
        bankName: "BCA",
        bankAccountNumber: "1234567890",
        bankAccountHolder: "Sri Rahayu",
      }).success,
    ).toBe(false);
  });

  it("memvalidasi komplain dan ulasan", () => {
    expect(
      disputeInputSchema.safeParse({ reason: "pendek", requestedSolution: "REFUND_FULL" })
        .success,
    ).toBe(false);
    expect(disputeMessageSchema.safeParse({ body: "" }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 5, comment: "Mantap" }).success).toBe(true);
  });
});
