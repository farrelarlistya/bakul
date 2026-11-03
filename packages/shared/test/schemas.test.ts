import { describe, expect, it } from "vitest";
import { addressInputSchema } from "../src/address";
import { requestOtpSchema, updateProfileSchema, verifyOtpSchema } from "../src/auth";
import { firstProductSchema, shopOnboardingSchema } from "../src/onboarding";

describe("skema akun dan onboarding", () => {
  it("merapikan nomor HP pada permintaan kode", () => {
    expect(requestOtpSchema.parse({ phone: "+62 812-3456-7890" })).toEqual({
      phone: "081234567890",
    });
  });

  it("mewajibkan kode 6 angka", () => {
    expect(verifyOtpSchema.safeParse({ phone: "081234567890", code: "12345" }).success).toBe(
      false,
    );
    expect(verifyOtpSchema.safeParse({ phone: "081234567890", code: "123456" }).success).toBe(
      true,
    );
  });

  it("menerima profil tanpa email dan menolak profil kosong", () => {
    expect(updateProfileSchema.parse({ name: "Sri" })).toEqual({ name: "Sri" });
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("memvalidasi alamat dan kode pos", () => {
    const address = addressInputSchema.parse({
      label: "Rumah",
      recipientName: "Sri Wahyuni",
      phone: "0812-3456-7890",
      provinceId: "34",
      cityId: "3404",
      districtId: "340401",
      postalCode: "55581",
      fullAddress: "Jl. Kaliurang KM 5, Sleman",
      isDefault: true,
    });

    expect(address.phone).toBe("081234567890");
    expect(
      addressInputSchema.safeParse({ ...address, postalCode: "55" }).success,
    ).toBe(false);
  });

  it("mengubah harga dari form menjadi integer", () => {
    const product = firstProductSchema.parse({ name: "Nastar", price: "45000" });
    expect(product.price).toBe(45000);
    expect(shopOnboardingSchema.safeParse({ name: "Dapur Bu Sri" }).success).toBe(false);
  });
});
