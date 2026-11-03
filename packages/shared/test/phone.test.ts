import { describe, expect, it } from "vitest";
import { normalizePhone, phoneSchema } from "../src/phone";

describe("normalizePhone", () => {
  it("menyeragamkan nomor Indonesia", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("081234567890");
    expect(normalizePhone("+62 812 3456 7890")).toBe("081234567890");
    expect(normalizePhone("6281234567890")).toBe("081234567890");
    expect(normalizePhone("81234567890")).toBe("081234567890");
  });

  it("menolak nomor yang tidak masuk akal", () => {
    expect(phoneSchema.safeParse("12345").success).toBe(false);
    expect(phoneSchema.safeParse("021234567").success).toBe(false);
  });
});
