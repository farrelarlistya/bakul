import { z } from "zod";
import { PAYMENT_METHOD_VALUES, type PaymentMethodValue } from "./commerce";

export const PAYMENT_METHODS: {
  value: PaymentMethodValue;
  label: string;
  bank: string | null;
  prefix: string | null;
  totalDigits: number;
  expiryMinutes: number;
  instruction: string;
}[] = [
  {
    value: "VA_BCA",
    label: "Kode pembayaran BCA",
    bank: "BCA",
    prefix: "8808",
    totalDigits: 14,
    expiryMinutes: 1440,
    instruction: "Buka BCA mobile, pilih m-Transfer, lalu masukkan kode pembayaran.",
  },
  {
    value: "VA_MANDIRI",
    label: "Kode pembayaran Mandiri",
    bank: "Mandiri",
    prefix: "89508",
    totalDigits: 15,
    expiryMinutes: 1440,
    instruction: "Buka Livin' by Mandiri, pilih Bayar, lalu masukkan kode pembayaran.",
  },
  {
    value: "VA_BNI",
    label: "Kode pembayaran BNI",
    bank: "BNI",
    prefix: "8810",
    totalDigits: 14,
    expiryMinutes: 1440,
    instruction: "Buka BNI mobile, pilih Transfer, lalu masukkan kode pembayaran.",
  },
  {
    value: "VA_BRI",
    label: "Kode pembayaran BRI",
    bank: "BRI",
    prefix: "8899",
    totalDigits: 14,
    expiryMinutes: 1440,
    instruction: "Buka BRImo, pilih BRIVA, lalu masukkan kode pembayaran.",
  },
  {
    value: "QRIS",
    label: "QRIS",
    bank: null,
    prefix: null,
    totalDigits: 0,
    expiryMinutes: 15,
    instruction: "Buka aplikasi dompet digital, pilih Scan QR, lalu pindai kode di layar.",
  },
];

export function paymentMethodLabel(value: string): string {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}

export type PaymentStatusValue = "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "REFUNDED";

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu dibayar",
  PAID: "Sudah dibayar",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  REFUNDED: "Dana dikembalikan",
};

export type OrderStatusValue =
  | "WAITING_PAYMENT"
  | "WAITING_SELLER_CONFIRMATION"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED_UNPAID"
  | "CANCELLED_BY_SELLER";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu dibayar",
  WAITING_SELLER_CONFIRMATION: "Menunggu penjual",
  PROCESSING: "Sedang disiapkan",
  READY_TO_SHIP: "Siap dikirim",
  SHIPPED: "Sudah dikirim",
  IN_TRANSIT: "Dalam perjalanan",
  DELIVERED: "Sampai tujuan",
  COMPLETED: "Selesai",
  DISPUTED: "Sedang dikomplain",
  REFUNDED: "Dana dikembalikan",
  RETURNING: "Barang dikembalikan",
  RETURNED: "Barang sudah kembali",
  CANCELLED_UNPAID: "Batal karena belum dibayar",
  CANCELLED_BY_SELLER: "Dibatalkan penjual",
};

export type EscrowStatusValue =
  | "PENDING"
  | "HELD"
  | "FROZEN"
  | "RELEASED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "CANCELLED";

export const ESCROW_STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu pembayaran",
  HELD: "Uang ditahan aman",
  FROZEN: "Uang dibekukan",
  RELEASED: "Dana diteruskan ke penjual",
  REFUNDED: "Dana dikembalikan ke pembeli",
  PARTIALLY_REFUNDED: "Dana dibagi ke dua pihak",
  CANCELLED: "Dibatalkan",
};

export const PAYMENT_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
  "REFUNDED",
] as const;

export type PaymentInvoiceSummary = {
  id: string;
  invoiceNumber: string;
  shopId: string;
  shopName: string;
  totalAmount: number;
  orderStatus: string;
  escrowStatus: string;
};

export type PaymentView = {
  id: string;
  status: string;
  method: string;
  methodLabel: string;
  paymentCode: string;
  totalAmount: number;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  invoices: PaymentInvoiceSummary[];
};

export type PaymentInstruction = {
  method: string;
  methodLabel: string;
  paymentCode: string;
  totalAmount: number;
  expiresAt: string;
  serverNow: string;
  speed: number;
  steps: string[];
  qrDataUrl: string | null;
  bankName: string | null;
};

export type OrderItemView = {
  id: string;
  productId: string | null;
  productSlug: string | null;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  weightGram: number;
  imageUrl: string | null;
  reviewed: boolean;
};

export type TrackingEvent = {
  status: string;
  label: string;
  note: string;
  location: string;
  at: string;
};

export type ShipmentView = {
  id: string;
  awb: string;
  courierCode: string;
  courierName: string;
  serviceType: string;
  shippingStatus: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  labelUrl: string | null;
  events: TrackingEvent[];
};

export type DisputeMessageView = {
  id: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

export type DisputeView = {
  id: string;
  status: string;
  reason: string;
  requestedSolution: string;
  evidenceUrls: string[];
  decisionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  messages: DisputeMessageView[];
};

export type OrderInvoiceView = {
  id: string;
  invoiceNumber: string;
  shop: { id: string; name: string; slug: string; cityName: string };
  buyerName: string;
  orderStatus: string;
  escrowStatus: string;
  subtotal: number;
  shippingCost: number;
  serviceFee: number;
  totalAmount: number;
  courierCode: string;
  courierName: string;
  courierService: string;
  courierServiceName: string;
  weightGram: number;
  items: OrderItemView[];
  itemCount: number;
  firstItemName: string;
  firstItemImage: string | null;
  recipient: {
    name: string;
    phone: string;
    cityName: string;
    districtName: string | null;
    postalCode: string;
    fullAddress: string;
  };
  notes: string | null;
  payment: {
    id: string;
    method: string;
    methodLabel: string;
    status: string;
    paymentCode: string;
    expiresAt: string;
  } | null;
  shipment: ShipmentView | null;
  dispute: DisputeView | null;
  sellerConfirmDeadline: string;
  autoCompleteAt: string | null;
  paidAt: string | null;
  acceptedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
  canComplete: boolean;
  canDispute: boolean;
  canReview: boolean;
};

export const reviewInputSchema = z.object({
  rating: z.coerce.number().int("Rating harus bilangan bulat.").min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  mediaUrls: z.array(z.string().max(500)).max(3).optional(),
});

export const DISPUTE_SOLUTIONS = ["REFUND_FULL", "REFUND_PARTIAL", "RETURN"] as const;
export type DisputeSolution = (typeof DISPUTE_SOLUTIONS)[number];

export const DISPUTE_SOLUTION_LABEL: Record<string, string> = {
  REFUND_FULL: "Uang kembali semua",
  REFUND_PARTIAL: "Uang kembali sebagian",
  RETURN: "Barang dikembalikan",
};

export const DISPUTE_STATUS_LABEL: Record<string, string> = {
  OPEN: "Komplain dibuka",
  WAITING_SELLER: "Menunggu penjual",
  ESCALATED_TO_ADMIN: "Menunggu admin",
  RESOLVED_BUYER: "Selesai, pembeli menang",
  RESOLVED_SELLER: "Selesai, penjual menang",
  CLOSED: "Selesai",
  CANCELLED_BY_BUYER: "Dicabut pembeli",
  AUTO_CLOSED_NO_RESPONSE: "Ditutup otomatis",
};

export const disputeInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Ceritakan masalahnya minimal 10 huruf.")
    .max(2000, "Cerita terlalu panjang."),
  requestedSolution: z.enum(DISPUTE_SOLUTIONS),
  evidenceUrls: z.array(z.string().max(500)).max(5).optional(),
});

export const disputeMessageSchema = z.object({
  body: z.string().trim().min(1, "Tulis pesan dulu.").max(2000),
});

export const ADMIN_DECISIONS = [
  "RELEASE",
  "REFUND_FULL",
  "REFUND_PARTIAL",
  "RETURN",
] as const;
export type AdminDecision = (typeof ADMIN_DECISIONS)[number];

export const adminDecisionSchema = z
  .object({
    decision: z.enum(ADMIN_DECISIONS),
    refundAmount: z.coerce.number().int().min(1).max(1_000_000_000).optional(),
    note: z.string().trim().min(3, "Tulis alasan keputusan.").max(2000),
  })
  .refine(
    (value) => value.decision !== "REFUND_PARTIAL" || value.refundAmount !== undefined,
    { message: "Isi jumlah uang yang dikembalikan.", path: ["refundAmount"] },
  );

export const sellerRejectSchema = z.object({
  reason: z.string().trim().min(3, "Tulis alasan penolakan.").max(500),
});

export const SELLER_CONFIRM_HOURS = 48;
export const AUTO_COMPLETE_HOURS = 72;
export const DISPUTE_WINDOW_HOURS = 48;
export const PAYMENT_VA_MINUTES = 24 * 60;
export const PAYMENT_QRIS_MINUTES = 15;

export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type DisputeInput = z.infer<typeof disputeInputSchema>;
export type DisputeMessageInput = z.infer<typeof disputeMessageSchema>;
export type AdminDecisionInput = z.infer<typeof adminDecisionSchema>;
export type SellerRejectInput = z.infer<typeof sellerRejectSchema>;

export const ORDER_STATUS_VALUES = [
  "WAITING_PAYMENT",
  "WAITING_SELLER_CONFIRMATION",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "DISPUTED",
  "REFUNDED",
  "RETURNING",
  "RETURNED",
  "CANCELLED_UNPAID",
  "CANCELLED_BY_SELLER",
] as const;

export {
  PAYMENT_METHOD_VALUES,
  type PaymentMethodValue,
};
