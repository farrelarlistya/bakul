import { Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";

export type StockRow = {
  id: string;
  stock_available: number;
  stock_reserved: number;
};

@Injectable()
export class InventoryService {
  async lock(tx: Prisma.TransactionClient, variantIds: string[]): Promise<StockRow[]> {
    if (variantIds.length === 0) {
      return [];
    }

    return tx.$queryRaw<StockRow[]>`
      SELECT id, stock_available, stock_reserved
      FROM product_variants
      WHERE id = ANY(${variantIds}::uuid[])
      ORDER BY id
      FOR UPDATE
    `;
  }

  async reserve(
    tx: Prisma.TransactionClient,
    rows: StockRow[],
    quantities: Map<string, number>,
  ): Promise<void> {
    for (const row of rows) {
      const quantity = quantities.get(row.id) ?? 0;
      if (quantity < 1 || row.stock_available < quantity) {
        continue;
      }

      await tx.productVariant.update({
        where: { id: row.id },
        data: {
          stockAvailable: { decrement: quantity },
          stockReserved: { increment: quantity },
        },
      });
    }
  }

  async release(
    tx: Prisma.TransactionClient,
    items: { variantId: string | null; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      if (!item.variantId || item.quantity < 1) {
        continue;
      }

      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stockReserved: true },
      });
      if (!variant) {
        continue;
      }

      const releaseQuantity = Math.min(item.quantity, variant.stockReserved);
      if (releaseQuantity < 1) {
        continue;
      }

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockAvailable: { increment: releaseQuantity },
          stockReserved: { decrement: releaseQuantity },
        },
      });
    }
  }

  async commit(
    tx: Prisma.TransactionClient,
    items: { variantId: string | null; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      if (!item.variantId || item.quantity < 1) {
        continue;
      }

      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stockReserved: true },
      });
      if (!variant) {
        continue;
      }

      const commitQuantity = Math.min(item.quantity, variant.stockReserved);
      if (commitQuantity < 1) {
        continue;
      }

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockReserved: { decrement: commitQuantity } },
      });
    }
  }
}
