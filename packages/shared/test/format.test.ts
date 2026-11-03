import { describe, expect, it } from "vitest";
import { formatRupiah } from "../src/format";

describe("formatRupiah", () => {
  it("memakai titik ribuan dan awalan Rp", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(1_000)).toBe("Rp 1.000");
    expect(formatRupiah(88_609)).toBe("Rp 88.609");
    expect(formatRupiah(1_250_000)).toBe("Rp 1.250.000");
  });

  it("menolak nominal pecahan", () => {
    expect(() => formatRupiah(1_000.5)).toThrow("bilangan bulat");
  });
});
