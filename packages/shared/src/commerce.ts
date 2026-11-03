import { z } from "zod";
import type { Address } from "./address";

export const COURIERS = [
  { code: "JNE", name: "JNE", multiplier: 1.0, services: ["REG", "YES", "OKE"] },
  { code: "JNT", name: "J&T Express", multiplier: 0.95, services: ["REG", "YES"] },
  { code: "SICEPAT", name: "SiCepat", multiplier: 0.92, services: ["REG", "YES", "OKE"] },
  { code: "ANTERAJA", name: "AnterAja", multiplier: 1.05, services: ["REG"] },
  { code: "POS", name: "POS Indonesia", multiplier: 1.1, services: ["REG", "OKE"] },
] as const;

export type CourierCode = (typeof COURIERS)[number]["code"];

export const COURIER_SERVICES = [
  { code: "REG", name: "Reguler", multiplier: 1.0, etd: "3–5 hari" },
  { code: "YES", name: "Kilat", multiplier: 1.8, etd: "1–2 hari" },
  { code: "OKE", name: "Hemat", multiplier: 0.85, etd: "5–7 hari" },
] as const;

export type ServiceCode = (typeof COURIER_SERVICES)[number]["code"];

export const COURIER_CODES = COURIERS.map((courier) => courier.code) as unknown as [
  CourierCode,
  ...CourierCode[],
];
export const SERVICE_CODES = COURIER_SERVICES.map((service) => service.code) as unknown as [
  ServiceCode,
  ...ServiceCode[],
];

export function courierName(code: string): string {
  return COURIERS.find((courier) => courier.code === code)?.name ?? code;
}

export function serviceName(code: string): string {
  return COURIER_SERVICES.find((service) => service.code === code)?.name ?? code;
}

export type ShippingRate = {
  courier: string;
  courierName: string;
  service: string;
  serviceName: string;
  etd: string;
  cost: number;
};

export type CartItemView = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  shopId: string;
  shopName: string;
  price: number;
  quantity: number;
  stockAvailable: number;
  weightGram: number;
  imageUrl: string | null;
  isSelected: boolean;
};

export type CartShopGroup = {
  shopId: string;
  shopName: string;
  shopSlug: string;
  cityName: string;
  supportedCouriers: string[];
  items: CartItemView[];
  subtotal: number;
  totalItems: number;
};

export type CartView = {
  shops: CartShopGroup[];
  totalItems: number;
  subtotal: number;
};

export const addCartItemSchema = z.object({
  variantId: z.string().uuid("Pilihan barang belum benar."),
  quantity: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat.")
    .min(1, "Jumlah minimal 1.")
    .max(99, "Jumlah maksimal 99."),
});

export const updateCartItemSchema = z
  .object({
    quantity: z.coerce.number().int().min(1).max(99).optional(),
    isSelected: z.boolean().optional(),
  })
  .refine((value) => value.quantity !== undefined || value.isSelected !== undefined, {
    message: "Isi jumlah atau pilihan barang.",
  });

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export type CheckoutShopQuote = {
  shopId: string;
  shopName: string;
  shopSlug: string;
  cityName: string;
  subtotal: number;
  weightGram: number;
  items: CartItemView[];
  rates: ShippingRate[];
};

export type CheckoutQuote = {
  address: Address;
  shops: CheckoutShopQuote[];
  subtotalItems: number;
  totalWeightGram: number;
  serviceFee: number;
  totalAmount: number;
};

export const checkoutQuoteSchema = z.object({
  addressId: z.string().uuid("Pilih alamat pengiriman dulu."),
});

export const shippingChoiceSchema = z.object({
  shopId: z.string().uuid("Toko belum benar."),
  courier: z.enum(COURIER_CODES),
  service: z.enum(SERVICE_CODES),
});

export const PAYMENT_METHOD_VALUES = [
  "VA_BCA",
  "VA_MANDIRI",
  "VA_BNI",
  "VA_BRI",
  "QRIS",
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD_VALUES)[number];

export const checkoutSchema = z.object({
  addressId: z.string().uuid("Pilih alamat pengiriman dulu."),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  shipping: z
    .array(shippingChoiceSchema)
    .min(1, "Pilih kurir untuk setiap toko.")
    .max(20),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ShippingChoice = z.infer<typeof shippingChoiceSchema>;

export type CheckoutResult = {
  paymentId: string;
  paymentCode: string;
  totalAmount: number;
  expiresAt: string;
  invoiceCount: number;
};
