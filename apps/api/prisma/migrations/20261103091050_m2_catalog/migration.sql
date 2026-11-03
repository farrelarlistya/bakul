-- AlterTable
ALTER TABLE "products" ADD COLUMN     "etalase_id" UUID;

-- CreateTable
CREATE TABLE "shop_etalases" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_etalases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_etalases_shop_id_idx" ON "shop_etalases"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_etalases_shop_id_slug_key" ON "shop_etalases"("shop_id", "slug");

-- CreateIndex
CREATE INDEX "reviews_product_id_created_at_idx" ON "reviews"("product_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_product_id_buyer_id_key" ON "reviews"("product_id", "buyer_id");

-- CreateIndex
CREATE INDEX "products_etalase_id_idx" ON "products"("etalase_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_etalase_id_fkey" FOREIGN KEY ("etalase_id") REFERENCES "shop_etalases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_etalases" ADD CONSTRAINT "shop_etalases_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Aturan nilai ulasan dan urutan etalase.
ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5);
ALTER TABLE "shop_etalases"
  ADD CONSTRAINT "shop_etalases_sort_order_nonnegative" CHECK ("sort_order" >= 0);
