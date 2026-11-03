import { describe, expect, it } from "vitest";
import {
  calculateNetSellerAmount,
  calculatePlatformFee,
  calculateServiceFee,
  calculateTotals,
} from "../src/fees";

describe("biaya pesanan", () => {
  it("menghitung contoh checkout desain: 70.000 + 17.000", () => {
    expect(calculateServiceFee(70_000, 17_000)).toBe(1_609);
    expect(calculatePlatformFee(70_000)).toBe(1_400);
    expect(calculateNetSellerAmount(70_000, 17_000)).toBe(85_600);
    expect(calculateTotals({ subtotalItems: 70_000, shippingCost: 17_000 })).toEqual({
      subtotalItems: 70_000,
      shippingCost: 17_000,
      serviceFee: 1_609,
      platformFee: 1_400,
      netSellerAmount: 85_600,
      totalAmount: 88_609,
    });
  });

  it("menghitung contoh PRD: 100.000 + 10.000", () => {
    expect(calculateServiceFee(100_000, 10_000)).toBe(1_770);
    expect(calculateTotals({ subtotalItems: 100_000, shippingCost: 10_000 }).totalAmount).toBe(
      111_770,
    );
  });

  it("menolak nilai negatif dan pecahan", () => {
    expect(() => calculateServiceFee(-1, 0)).toThrow("tidak negatif");
    expect(() => calculatePlatformFee(10_000.5)).toThrow("integer rupiah");
  });
});
