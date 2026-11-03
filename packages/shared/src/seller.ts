import { z } from "zod";

export const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE", "DELETED"] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export const etalaseInputSchema = z.object({
  name: z.string().trim().min(1, "Nama etalase wajib diisi.").max(80),
});

export const variantInputSchema = z.object({
  name: z.string().trim().min(1, "Nama pilihan wajib diisi.").max(80),
  price: z.coerce
    .number()
    .int("Harga harus bilangan bulat.")
    .min(1_000, "Harga minimal Rp 1.000.")
    .max(100_000_000, "Harga maksimal Rp 100.000.000."),
  stockAvailable: z.coerce
    .number()
    .int("Stok harus bilangan bulat.")
    .min(0, "Stok tidak boleh negatif.")
    .max(1_000_000),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Nama barang minimal 2 huruf.").max(140),
  categoryId: z.string().uuid("Kategori belum benar."),
  etalaseId: z.string().uuid("Etalase belum benar.").nullable().optional(),
  description: z.string().trim().max(2_000).optional(),
  weightGram: z.coerce.number().int().min(1).max(50_000).default(250),
  variants: z.array(variantInputSchema).min(1, "Isi minimal satu pilihan.").max(5),
});

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(140).optional(),
    categoryId: z.string().uuid().optional(),
    etalaseId: z.string().uuid().nullable().optional(),
    description: z.string().trim().max(2_000).optional(),
    weightGram: z.coerce.number().int().min(1).max(50_000).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Isi setidaknya satu bagian.",
  });

export const variantUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    price: z.coerce.number().int().min(1_000).max(100_000_000).optional(),
    stockAvailable: z.coerce.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Isi setidaknya satu bagian.",
  });

export const productStatusSchema = z.object({
  status: z.enum(PRODUCT_STATUSES),
});

export type EtalaseInput = z.infer<typeof etalaseInputSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type VariantUpdateInput = z.infer<typeof variantUpdateSchema>;
