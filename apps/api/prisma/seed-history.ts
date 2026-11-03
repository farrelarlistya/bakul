import { calculateTotals, courierName, findWilayah } from "@bakul/shared";
import { createHash } from "node:crypto";
import type { PrismaClient } from "../src/generated/prisma/client";

type HistoryStatus =
  | "COMPLETED"
  | "DELIVERED"
  | "IN_TRANSIT"
  | "WAITING_SELLER_CONFIRMATION"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED_UNPAID"
  | "WAITING_PAYMENT"
  | "READY_TO_SHIP"
  | "SHIPPED";

const STATUS_PLAN: HistoryStatus[] = [
  ...Array<HistoryStatus>(12).fill("COMPLETED"),
  ...Array<HistoryStatus>(4).fill("DELIVERED"),
  ...Array<HistoryStatus>(3).fill("IN_TRANSIT"),
  ...Array<HistoryStatus>(2).fill("WAITING_SELLER_CONFIRMATION"),
  ...Array<HistoryStatus>(2).fill("DISPUTED"),
  ...Array<HistoryStatus>(2).fill("REFUNDED"),
  ...Array<HistoryStatus>(2).fill("CANCELLED_UNPAID"),
  "WAITING_PAYMENT",
  "READY_TO_SHIP",
  "SHIPPED",
];

const HISTORY_DAYS = 30;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function seedId(group: number, index: number): string {
  return `${group.toString(16).padStart(8, "0")}-0000-4000-8000-${index
    .toString(16)
    .padStart(12, "0")}`;
}

function awbFor(invoiceId: string, courier: string): string {
  const digest = createHash("sha256").update(invoiceId).digest("hex");
  let digits = "";
  for (let index = 0; digits.length < 20; index += 1) {
    const byte = Number.parseInt(digest.slice((index * 2) % 60, (index * 2) % 60 + 2), 16);
    digits += String(byte % 10);
  }
  switch (courier) {
    case "JNT":
      return `JP${digits.slice(0, 10)}`;
    case "SICEPAT":
      return `00${digits.slice(0, 12)}`;
    case "ANTERAJA":
      return `100${digits.slice(0, 10)}`;
    case "POS":
      return `P${digits.slice(0, 12)}`;
    default:
      return digits.slice(0, 15);
  }
}

function paymentCode(method: string, index: number): string {
  const tail = String(1000000000 + index).padStart(10, "0");
  if (method === "VA_MANDIRI") {
    return `89508${tail}`;
  }
  if (method === "VA_BNI") {
    return `8810${tail}`;
  }
  if (method === "VA_BRI") {
    return `8899${tail}`;
  }
  return `8808${tail}`;
}

function timelineFor(
  status: HistoryStatus,
  shipmentCreatedAt: Date,
  origin: string,
  destination: string,
  district: string | null,
): { status: string; events: unknown[]; deliveredAt: Date | null } {
  const steps = [
    { status: "PICKED_UP", label: "Paket diambil kurir", note: `Paket sudah diambil kurir di ${origin}.`, location: origin, hours: 0 },
    { status: "IN_TRANSIT", label: "Paket dalam perjalanan", note: `Paket tiba di hub ${origin}.`, location: `Hub ${origin}`, hours: 3 },
    { status: "IN_TRANSIT", label: "Paket dalam perjalanan", note: `Paket transit menuju ${destination}.`, location: "Hub transit", hours: 14 },
    { status: "ARRIVED_AT_DESTINATION", label: "Paket sampai di kota tujuan", note: `Paket tiba di ${destination}.`, location: destination, hours: 26 },
    { status: "OUT_FOR_DELIVERY", label: "Paket sedang diantar", note: "Kurir menuju alamat penerima.", location: district ?? destination, hours: 30 },
    { status: "DELIVERED", label: "Paket sudah sampai", note: `Paket diterima di ${destination}.`, location: district ?? destination, hours: 32 },
  ];

  const limit =
    status === "DELIVERED" || status === "COMPLETED"
      ? 6
      : status === "IN_TRANSIT"
        ? 3
        : status === "SHIPPED"
          ? 1
          : 0;

  const events = steps.slice(0, limit).map((step) => ({
    status: step.status,
    label: step.label,
    note: step.note,
    location: step.location,
    at: new Date(shipmentCreatedAt.getTime() + step.hours * HOUR).toISOString(),
  }));

  const deliveredAt =
    limit === 6
      ? new Date(shipmentCreatedAt.getTime() + 32 * HOUR)
      : null;

  return {
    status: events.at(-1)?.status ?? "AWB_CREATED",
    events,
    deliveredAt,
  };
}

export async function seedHistory(prisma: PrismaClient): Promise<number> {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ["demo_epoch", "demo_started_at", "demo_speed"] } },
  });
  const setting = new Map(settings.map((row) => [row.key, row.value]));
  const epoch = typeof setting.get("demo_epoch") === "string"
    ? new Date(setting.get("demo_epoch") as string)
    : null;
  const startedAt = typeof setting.get("demo_started_at") === "string"
    ? new Date(setting.get("demo_started_at") as string)
    : null;
  const speed =
    typeof setting.get("demo_speed") === "number" ? (setting.get("demo_speed") as number) : 1;
  const now =
    process.env["DEMO_MODE"] === "true" && epoch && startedAt
      ? new Date(
          epoch.getTime() + (Date.now() - startedAt.getTime()) * Math.max(1, speed),
        )
      : new Date();
  const shops = await prisma.shop.findMany({
    where: { status: "ACTIVE" },
    include: {
      products: {
        where: { status: "ACTIVE" },
        include: {
          variants: { orderBy: { price: "asc" } },
          images: { orderBy: { position: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      },
      owner: { select: { phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const buyers = await prisma.user.findMany({
    where: { role: "BUYER" },
    orderBy: { phone: "asc" },
    include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
  });

  if (shops.length < 5 || buyers.length < 5) {
    console.warn("Seed riwayat dilewati: toko atau pembeli belum cukup.");
    return 0;
  }

  let journalIndex = 1;
  let created = 0;

  for (let index = 0; index < STATUS_PLAN.length; index += 1) {
    const status = STATUS_PLAN[index];
    if (!status) {
      continue;
    }

    const invoiceId = seedId(12, index + 1);
    const existing = await prisma.orderInvoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });
    if (existing) {
      continue;
    }

    const shop = shops[index % shops.length];
    const buyer = buyers[index % buyers.length];
    const product = shop?.products[index % (shop.products.length || 1)];
    const variant = product?.variants[0];
    const address = buyer?.addresses[0];
    if (!shop || !buyer || !product || !variant || !address) {
      continue;
    }

    const area = findWilayah(address.cityId);
    const quantity = index % 3 === 0 ? 2 : 1;
    const subtotal = variant.price * quantity;
    const shippingCost = 9_000 + (index % 4) * 3_000;
    const totals = calculateTotals({
      subtotalItems: subtotal,
      shippingCost,
    });
    const courier = shop.supportedCouriers[0] ?? "JNE";
    const paymentId = seedId(13, index + 1);
    const method = ["VA_BCA", "VA_MANDIRI", "VA_BNI", "VA_BRI"][index % 4] ?? "VA_BCA";
    const activeHoursAgo: Partial<Record<HistoryStatus, number>> = {
      WAITING_PAYMENT: 1,
      WAITING_SELLER_CONFIRMATION: 3,
      READY_TO_SHIP: 8,
      SHIPPED: 10,
      IN_TRANSIT: 30,
      DELIVERED: 96,
      DISPUTED: 96,
    };
    const createdAt = activeHoursAgo[status]
      ? new Date(now.getTime() - (activeHoursAgo[status] as number) * HOUR)
      : new Date(now.getTime() - (HISTORY_DAYS - index) * DAY);
    const paid = !["CANCELLED_UNPAID", "WAITING_PAYMENT"].includes(status);
    const paidAt = paid ? new Date(createdAt.getTime() + HOUR) : null;
    const paymentStatus =
      status === "CANCELLED_UNPAID"
        ? "EXPIRED"
        : status === "WAITING_PAYMENT"
          ? "PENDING"
          : status === "REFUNDED"
            ? "REFUNDED"
            : "PAID";
    const expiresAt =
      status === "WAITING_PAYMENT"
        ? new Date(now.getTime() + 6 * HOUR)
        : new Date(createdAt.getTime() + 24 * HOUR);

    const escrowStatus =
      status === "COMPLETED"
        ? "RELEASED"
        : status === "REFUNDED"
          ? "REFUNDED"
          : status === "DISPUTED"
            ? "FROZEN"
            : status === "CANCELLED_UNPAID"
              ? "CANCELLED"
              : status === "WAITING_PAYMENT"
                ? "PENDING"
                : "HELD";

    const deliveredAt =
      status === "COMPLETED"
        ? new Date(now.getTime() - (index % 6 + 2) * DAY)
        : status === "DELIVERED" || status === "DISPUTED"
          ? new Date(now.getTime() - 6 * HOUR)
          : null;
    const completedAt =
      status === "COMPLETED"
        ? new Date((deliveredAt?.getTime() ?? now.getTime()) + DAY)
        : null;
    const autoCompleteAt =
      status === "DELIVERED" || status === "DISPUTED"
        ? new Date((deliveredAt?.getTime() ?? now.getTime()) + 72 * HOUR)
        : null;
    const cancelledAt =
      status === "CANCELLED_UNPAID" ? new Date(createdAt.getTime() + 24 * HOUR) : null;
    const acceptedAt =
      ["READY_TO_SHIP", "SHIPPED", "IN_TRANSIT", "DELIVERED", "COMPLETED", "DISPUTED"].includes(
        status,
      ) && paidAt
        ? new Date(paidAt.getTime() + 2 * HOUR)
        : null;

    const shipmentCreatedAt =
      status === "READY_TO_SHIP"
        ? new Date(now.getTime() + 2 * HOUR)
        : status === "SHIPPED"
          ? new Date(now.getTime() - 3 * HOUR)
          : status === "IN_TRANSIT"
            ? new Date(now.getTime() - 20 * HOUR)
            : deliveredAt
              ? new Date(deliveredAt.getTime() - 32 * HOUR)
              : null;
    const timeline = shipmentCreatedAt
      ? timelineFor(
          status,
          shipmentCreatedAt,
          shop.cityName,
          area?.cityName ?? shop.cityName,
          area?.districtName ?? null,
        )
      : null;

    const invoiceNumber = `INV-H-${String(index + 1).padStart(3, "0")}`;
    const invoiceStatus =
      status === "WAITING_PAYMENT"
        ? "WAITING_PAYMENT"
        : status === "CANCELLED_UNPAID"
          ? "CANCELLED_UNPAID"
          : status === "REFUNDED"
            ? "REFUNDED"
            : status === "DISPUTED"
              ? "DISPUTED"
              : status;

    await prisma.payment.upsert({
      where: { id: paymentId },
      update: {},
      create: {
        id: paymentId,
        buyerId: buyer.id,
        idempotencyKey: `seed-history-${index + 1}`,
        paymentCode: paymentCode(method, index),
        method: method as "VA_BCA" | "VA_MANDIRI" | "VA_BNI" | "VA_BRI",
        providerRef: `chg_seed_${String(index + 1).padStart(3, "0")}`,
        totalAmount: totals.totalAmount,
        status: paymentStatus as "PAID" | "PENDING" | "EXPIRED" | "REFUNDED",
        expiresAt,
        paidAt,
        createdAt,
      },
    });

    await prisma.orderInvoice.create({
      data: {
        id: invoiceId,
        paymentId,
        invoiceNumber,
        buyerId: buyer.id,
        shopId: shop.id,
        recipientName: address.recipientName,
        recipientPhone: address.phone,
        cityId: address.cityId,
        cityName: area?.cityName ?? shop.cityName,
        districtName: area?.districtName ?? null,
        postalCode: address.postalCode,
        fullAddress: address.fullAddress,
        notes: index % 5 === 0 ? "Tolong dibungkus rapi." : null,
        subtotal: totals.subtotalItems,
        shippingCost: totals.shippingCost,
        serviceFee: totals.serviceFee,
        platformFee: totals.platformFee,
        netSellerAmount: totals.netSellerAmount,
        totalAmount: totals.totalAmount,
        courierCode: courier,
        courierName: courierName(courier),
        courierService: "REG",
        weightGram: product.weightGram * quantity,
        escrowStatus: escrowStatus as
          | "PENDING"
          | "HELD"
          | "FROZEN"
          | "RELEASED"
          | "REFUNDED"
          | "CANCELLED",
        orderStatus: invoiceStatus as
          | "WAITING_PAYMENT"
          | "WAITING_SELLER_CONFIRMATION"
          | "READY_TO_SHIP"
          | "SHIPPED"
          | "IN_TRANSIT"
          | "DELIVERED"
          | "COMPLETED"
          | "DISPUTED"
          | "REFUNDED"
          | "CANCELLED_UNPAID",
        sellerConfirmDeadline: paidAt
          ? new Date(paidAt.getTime() + 48 * HOUR)
          : new Date(createdAt.getTime() + 48 * HOUR),
        paidAt,
        acceptedAt,
        shippedAt: shipmentCreatedAt,
        deliveredAt,
        autoCompleteAt,
        completedAt,
        cancelledAt,
        createdAt,
        updatedAt: completedAt ?? deliveredAt ?? paidAt ?? createdAt,
        items: {
          create: {
            id: seedId(14, index + 1),
            productId: product.id,
            variantId: variant.id,
            nameSnapshot: product.name,
            variantSnapshot: variant.name,
            priceSnapshot: variant.price,
            weightSnapshot: product.weightGram,
            quantity,
            imageUrl: product.images[0]?.url ?? null,
          },
        },
        ...(timeline
          ? {
              shipment: {
                create: {
                  id: seedId(15, index + 1),
                  courierCode: courier,
                  courierName: courierName(courier),
                  serviceType: "REG",
                  awb: awbFor(invoiceId, courier),
                  labelUrl: `/api/v1/seller/orders/${invoiceId}/label.pdf`,
                  shippingStatus: timeline.status as
                    | "AWB_CREATED"
                    | "PICKED_UP"
                    | "IN_TRANSIT"
                    | "DELIVERED",
                  trackingHistory: timeline.events as unknown as string[],
                  shippedAt: timeline.events.length > 0 ? shipmentCreatedAt : null,
                  deliveredAt: timeline.deliveredAt,
                  createdAt: shipmentCreatedAt,
                },
              },
            }
          : {}),
        ...(status === "DISPUTED"
          ? {
              dispute: {
                create: {
                  id: seedId(16, index + 1),
                  buyerId: buyer.id,
                  shopId: shop.id,
                  reason:
                    index % 2 === 0
                      ? "Barang datang penyok dan warna berbeda dari foto."
                      : "Isi paket kurang satu, padahal pesanan dua barang.",
                  requestedSolution: index % 2 === 0 ? "REFUND_PARTIAL" : "RETURN",
                  evidenceUrls: [],
                  status: index % 2 === 0 ? "WAITING_SELLER" : "ESCALATED_TO_ADMIN",
                  createdAt: new Date(now.getTime() - 10 * HOUR),
                  messages: {
                    create: [
                      {
                        senderId: buyer.id,
                        senderRole: "BUYER",
                        body: "Barang tidak sesuai. Mohon dibantu, ya.",
                        createdAt: new Date(now.getTime() - 10 * HOUR),
                      },
                      {
                        senderId: shop.ownerUserId,
                        senderRole: "SELLER",
                        body: "Mohon maaf. Boleh dikirim foto bagian yang rusak?",
                        createdAt: new Date(now.getTime() - 8 * HOUR),
                      },
                    ],
                  },
                },
              },
            }
          : {}),
      },
    });

    if (paid && paidAt) {
      await prisma.ledgerJournal.upsert({
        where: { id: seedId(18, journalIndex) },
        update: {},
        create: {
          id: seedId(18, journalIndex),
          refType: "PAYMENT",
          refId: `${paymentId}:${invoiceId}`,
          description: `Uang diterima untuk ${invoiceNumber}`,
          createdAt: paidAt,
          entries: {
            create: [
              { accountCode: "CASH", direction: "DEBIT", amount: totals.totalAmount },
              {
                accountCode: "ESCROW_LIABILITY",
                direction: "CREDIT",
                amount: totals.totalAmount,
                shopId: shop.id,
              },
            ],
          },
        },
      });
      journalIndex += 1;

      const pgFee = Math.round(totals.totalAmount * 0.007);
      if (pgFee > 0) {
        await prisma.ledgerJournal.upsert({
          where: { id: seedId(18, journalIndex) },
          update: {},
          create: {
            id: seedId(18, journalIndex),
            refType: "PG_FEE",
            refId: paymentId,
            description: "Biaya layanan pembayaran (disubsidi platform)",
            createdAt: paidAt,
            entries: {
              create: [
                { accountCode: "PG_FEE_EXPENSE", direction: "DEBIT", amount: pgFee },
                { accountCode: "CASH", direction: "CREDIT", amount: pgFee },
              ],
            },
          },
        });
        journalIndex += 1;
      }

      if (status === "COMPLETED") {
        await prisma.ledgerJournal.upsert({
          where: { id: seedId(18, journalIndex) },
          update: {},
          create: {
            id: seedId(18, journalIndex),
            refType: "ESCROW_RELEASE",
            refId: invoiceId,
            description: `Pesanan ${invoiceNumber} selesai`,
            createdAt: completedAt ?? now,
            entries: {
              create: [
                {
                  accountCode: "ESCROW_LIABILITY",
                  direction: "DEBIT",
                  amount: totals.totalAmount,
                  shopId: shop.id,
                },
                {
                  accountCode: `SELLER_PAYABLE:${shop.id}`,
                  direction: "CREDIT",
                  amount: totals.netSellerAmount,
                  shopId: shop.id,
                },
                {
                  accountCode: "PLATFORM_REVENUE",
                  direction: "CREDIT",
                  amount: totals.platformFee + totals.serviceFee,
                },
              ],
            },
          },
        });
        journalIndex += 1;
      }

      if (status === "REFUNDED") {
        await prisma.ledgerJournal.upsert({
          where: { id: seedId(18, journalIndex) },
          update: {},
          create: {
            id: seedId(18, journalIndex),
            refType: "ESCROW_REFUND",
            refId: invoiceId,
            description: `Uang pesanan ${invoiceNumber} dikembalikan`,
            createdAt: new Date(paidAt.getTime() + 2 * DAY),
            entries: {
              create: [
                {
                  accountCode: "ESCROW_LIABILITY",
                  direction: "DEBIT",
                  amount: totals.totalAmount,
                  shopId: shop.id,
                },
                { accountCode: "CASH", direction: "CREDIT", amount: totals.totalAmount },
              ],
            },
          },
        });
        journalIndex += 1;
      }
    }

    created += 1;
  }

  // Dompet dihitung ulang dari ledger agar seed aman dijalankan berulang.
  for (const shop of shops) {
    const wallet = await prisma.shopWallet.upsert({
      where: { shopId: shop.id },
      update: {},
      create: { shopId: shop.id },
    });

    if (shop === shops[0]) {
      await prisma.withdrawal.upsert({
        where: { id: seedId(19, 1) },
        update: {},
        create: {
          id: seedId(19, 1),
          shopWalletId: wallet.id,
          shopId: shop.id,
          idempotencyKey: "seed-withdrawal-001",
          amount: 75_000,
          bankName: shop.bankName ?? "BCA",
          bankAccountNumber: shop.bankAccountNumber ?? "0000000001",
          bankAccountHolder: shop.bankAccountHolder ?? shop.name,
          status: "REQUESTED",
          requestedAt: new Date(now.getTime() - 2 * HOUR),
        },
      });
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: { accountCode: `SELLER_PAYABLE:${shop.id}` },
    });
    const payable = entries.reduce(
      (total, entry) =>
        total + (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0,
    );
    const requested = await prisma.withdrawal.aggregate({
      where: { shopId: shop.id, status: "REQUESTED" },
      _sum: { amount: true },
    });
    const withheld = requested._sum.amount ?? 0;

    await prisma.shopWallet.update({
      where: { id: wallet.id },
      data: {
        balanceAvailable: Math.max(0, payable - withheld),
        balanceWithheld: withheld,
      },
    });
  }

  return created;
}
