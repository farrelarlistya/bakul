-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VA_BCA', 'VA_MANDIRI', 'VA_BNI', 'VA_BRI', 'QRIS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('WAITING_PAYMENT', 'WAITING_SELLER_CONFIRMATION', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'REFUNDED', 'RETURNING', 'RETURNED', 'CANCELLED_UNPAID', 'CANCELLED_BY_SELLER');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING', 'HELD', 'FROZEN', 'RELEASED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'AWB_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED_TO_SENDER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'WAITING_SELLER', 'ESCALATED_TO_ADMIN', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED', 'CANCELLED_BY_BUYER', 'AUTO_CLOSED_NO_RESPONSE');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- DropIndex
DROP INDEX "reviews_product_id_buyer_id_key";

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "media_urls" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "order_item_id" UUID;

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_selected" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "payment_code" VARCHAR(40) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "provider_ref" VARCHAR(60) NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_invoices" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "invoice_number" VARCHAR(30) NOT NULL,
    "buyer_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "recipient_name" VARCHAR(120) NOT NULL,
    "recipient_phone" VARCHAR(20) NOT NULL,
    "city_id" VARCHAR(10) NOT NULL,
    "city_name" VARCHAR(80) NOT NULL,
    "district_name" VARCHAR(80),
    "postal_code" VARCHAR(10) NOT NULL,
    "full_address" TEXT NOT NULL,
    "notes" TEXT,
    "subtotal" INTEGER NOT NULL,
    "shipping_cost" INTEGER NOT NULL,
    "service_fee" INTEGER NOT NULL,
    "platform_fee" INTEGER NOT NULL,
    "net_seller_amount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "courier_code" VARCHAR(20) NOT NULL,
    "courier_name" VARCHAR(40) NOT NULL,
    "courier_service" VARCHAR(10) NOT NULL,
    "weight_gram" INTEGER NOT NULL,
    "escrow_status" "EscrowStatus" NOT NULL DEFAULT 'PENDING',
    "order_status" "OrderStatus" NOT NULL DEFAULT 'WAITING_PAYMENT',
    "seller_confirm_deadline" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "auto_complete_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_invoice_id" UUID NOT NULL,
    "product_id" UUID,
    "variant_id" UUID,
    "name_snapshot" VARCHAR(140) NOT NULL,
    "variant_snapshot" VARCHAR(80) NOT NULL,
    "price_snapshot" INTEGER NOT NULL,
    "weight_snapshot" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "image_url" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "order_invoice_id" UUID NOT NULL,
    "courier_code" VARCHAR(20) NOT NULL,
    "courier_name" VARCHAR(40) NOT NULL,
    "service_type" VARCHAR(10) NOT NULL,
    "awb" VARCHAR(30) NOT NULL,
    "label_url" TEXT,
    "shipping_status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "tracking_history" JSONB NOT NULL DEFAULT '[]',
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "order_invoice_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "requested_solution" VARCHAR(40) NOT NULL,
    "evidence_urls" JSONB NOT NULL DEFAULT '[]',
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "decision_note" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" UUID NOT NULL,
    "dispute_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "sender_role" "UserRole" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_wallets" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "balance_available" INTEGER NOT NULL DEFAULT 0,
    "balance_withheld" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL,
    "shop_wallet_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL,
    "bank_name" VARCHAR(60) NOT NULL,
    "bank_account_number" VARCHAR(40) NOT NULL,
    "bank_account_holder" VARCHAR(120) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "note" TEXT,
    "transfer_proof_url" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_journals" (
    "id" UUID NOT NULL,
    "ref_type" VARCHAR(40) NOT NULL,
    "ref_id" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "journal_id" UUID NOT NULL,
    "account_code" VARCHAR(60) NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "shop_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "event_id" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(60) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_code_key" ON "payments"("payment_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_ref_key" ON "payments"("provider_ref");

-- CreateIndex
CREATE INDEX "payments_buyer_id_created_at_idx" ON "payments"("buyer_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_status_expires_at_idx" ON "payments"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_invoices_invoice_number_key" ON "order_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "order_invoices_buyer_id_created_at_idx" ON "order_invoices"("buyer_id", "created_at");

-- CreateIndex
CREATE INDEX "order_invoices_shop_id_order_status_idx" ON "order_invoices"("shop_id", "order_status");

-- CreateIndex
CREATE INDEX "order_invoices_order_status_seller_confirm_deadline_idx" ON "order_invoices"("order_status", "seller_confirm_deadline");

-- CreateIndex
CREATE INDEX "order_items_order_invoice_id_idx" ON "order_items"("order_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_invoice_id_key" ON "shipments"("order_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_awb_key" ON "shipments"("awb");

-- CreateIndex
CREATE INDEX "shipments_shipping_status_idx" ON "shipments"("shipping_status");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_order_invoice_id_key" ON "disputes"("order_invoice_id");

-- CreateIndex
CREATE INDEX "disputes_status_created_at_idx" ON "disputes"("status", "created_at");

-- CreateIndex
CREATE INDEX "dispute_messages_dispute_id_created_at_idx" ON "dispute_messages"("dispute_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "shop_wallets_shop_id_key" ON "shop_wallets"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_idempotency_key_key" ON "withdrawals"("idempotency_key");

-- CreateIndex
CREATE INDEX "withdrawals_shop_id_created_at_idx" ON "withdrawals"("shop_id", "created_at");

-- CreateIndex
CREATE INDEX "withdrawals_status_idx" ON "withdrawals"("status");

-- CreateIndex
CREATE INDEX "ledger_journals_ref_type_ref_id_idx" ON "ledger_journals"("ref_type", "ref_id");

-- CreateIndex
CREATE INDEX "ledger_entries_journal_id_idx" ON "ledger_entries"("journal_id");

-- CreateIndex
CREATE INDEX "ledger_entries_account_code_idx" ON "ledger_entries"("account_code");

-- CreateIndex
CREATE INDEX "ledger_entries_shop_id_idx" ON "ledger_entries"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "webhook_events_status_received_at_idx" ON "webhook_events"("status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_order_item_id_key" ON "reviews"("order_item_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_invoices" ADD CONSTRAINT "order_invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_invoices" ADD CONSTRAINT "order_invoices_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_invoices" ADD CONSTRAINT "order_invoices_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_invoice_id_fkey" FOREIGN KEY ("order_invoice_id") REFERENCES "order_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_invoice_id_fkey" FOREIGN KEY ("order_invoice_id") REFERENCES "order_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_invoice_id_fkey" FOREIGN KEY ("order_invoice_id") REFERENCES "order_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_wallets" ADD CONSTRAINT "shop_wallets_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_shop_wallet_id_fkey" FOREIGN KEY ("shop_wallet_id") REFERENCES "shop_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "ledger_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Aturan nilai uang, stok, dan jumlah barang.
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_total_positive" CHECK ("total_amount" > 0);
ALTER TABLE "order_invoices"
  ADD CONSTRAINT "order_invoices_amounts_nonnegative" CHECK (
    "subtotal" >= 0 AND "shipping_cost" >= 0 AND "service_fee" >= 0 AND
    "platform_fee" >= 0 AND "net_seller_amount" >= 0 AND "total_amount" >= 0
  ),
  ADD CONSTRAINT "order_invoices_total_formula" CHECK (
    "total_amount" = "subtotal" + "shipping_cost" + "service_fee"
  ),
  ADD CONSTRAINT "order_invoices_platform_fee_formula" CHECK (
    "platform_fee" = round("subtotal" * 0.02)::int
  ),
  ADD CONSTRAINT "order_invoices_net_seller_formula" CHECK (
    "net_seller_amount" = "subtotal" + "shipping_cost" - "platform_fee"
  ),
  ADD CONSTRAINT "order_invoices_service_fee_formula" CHECK (
    "service_fee" = 1000 + round(("subtotal" + "shipping_cost") * 0.007)::int
  );
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "withdrawals"
  ADD CONSTRAINT "withdrawals_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_stock_nonnegative" CHECK (
    "stock_available" >= 0 AND "stock_reserved" >= 0
  );

-- Maksimal satu alamat default per pengguna.
CREATE UNIQUE INDEX "user_addresses_one_default"
  ON "user_addresses"("user_id") WHERE "is_default";

-- Ledger append-only: update dan delete ditolak database.
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries bersifat append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_entries_append_only
  BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
