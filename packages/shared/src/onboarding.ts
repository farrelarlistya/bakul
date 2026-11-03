import { z } from "zod";

export const shopOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Nama toko minimal 2 huruf.").max(120),
  cityId: z.string().trim().min(1).max(10),
  cityName: z.string().trim().min(2, "Kota wajib dipilih.").max(80),
  description: z.string().trim().max(500).optional(),
});

export const firstProductSchema = z.object({
  name: z.string().trim().min(2, "Nama barang minimal 2 huruf.").max(140),
  price: z.coerce
    .number()
    .int("Harga harus bilangan bulat.")
    .min(1_000, "Harga minimal Rp 1.000.")
    .max(100_000_000, "Harga maksimal Rp 100.000.000."),
  weightGram: z.coerce
    .number()
    .int("Berat harus bilangan bulat.")
    .min(1)
    .max(50_000)
    .optional(),
  categoryId: z.string().uuid("Kategori belum benar.").optional(),
  description: z.string().trim().max(2_000).optional(),
});

export type ShopOnboardingInput = z.infer<typeof shopOnboardingSchema>;
export type FirstProductInput = z.infer<typeof firstProductSchema>;
