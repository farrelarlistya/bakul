import { ORDER_STATUS_LABEL } from "@bakul/shared";

const TONE: Record<string, string> = {
  WAITING_PAYMENT: "bg-krem text-perhatian-tua",
  WAITING_SELLER_CONFIRMATION: "bg-mint-muda text-teal-aksi",
  PROCESSING: "bg-mint-muda text-teal-aksi",
  READY_TO_SHIP: "bg-mint text-teal-tua",
  SHIPPED: "bg-mint text-teal-tua",
  IN_TRANSIT: "bg-mint text-teal-tua",
  DELIVERED: "bg-mint text-teal-tua",
  COMPLETED: "bg-mint-muda text-teal-aksi",
  DISPUTED: "bg-[#fbeae8] text-bahaya",
  REFUNDED: "bg-krem text-tinta",
  RETURNING: "bg-krem text-perhatian-tua",
  RETURNED: "bg-krem text-tinta",
  CANCELLED_UNPAID: "bg-abu-kartu text-tinta-lembut",
  CANCELLED_BY_SELLER: "bg-abu-kartu text-tinta-lembut",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-pil px-3 text-base font-semibold ${
        TONE[status] ?? "bg-abu-kartu text-tinta"
      }`}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}
