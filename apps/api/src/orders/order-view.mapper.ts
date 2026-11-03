import {
  AUTO_COMPLETE_HOURS,
  DISPUTE_WINDOW_HOURS,
  paymentMethodLabel,
  serviceName,
  type DisputeView,
  type OrderInvoiceView,
  type ShipmentView,
  type TrackingEvent,
} from "@bakul/shared";
import { Prisma } from "../generated/prisma/client";

export const orderInvoiceInclude = {
  shop: { select: { id: true, name: true, slug: true, cityName: true } },
  buyer: { select: { name: true } },
  payment: {
    select: {
      id: true,
      method: true,
      status: true,
      paymentCode: true,
      expiresAt: true,
    },
  },
  items: {
    include: {
      product: { select: { slug: true } },
      review: { select: { id: true } },
    },
    orderBy: { id: "asc" },
  },
  shipment: true,
  dispute: {
    include: {
      messages: {
        include: { sender: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  },
} satisfies Prisma.OrderInvoiceInclude;

export type OrderInvoiceRow = Prisma.OrderInvoiceGetPayload<{
  include: typeof orderInvoiceInclude;
}>;

function events(value: unknown): TrackingEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is TrackingEvent => {
    return (
      typeof item === "object" &&
      item !== null &&
      "status" in item &&
      "label" in item &&
      "at" in item
    );
  });
}

export function toOrderInvoiceView(
  invoice: OrderInvoiceRow,
  now: Date,
): OrderInvoiceView {
  const items = invoice.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productSlug: item.product?.slug ?? null,
    name: item.nameSnapshot,
    variant: item.variantSnapshot,
    price: item.priceSnapshot,
    quantity: item.quantity,
    weightGram: item.weightSnapshot,
    imageUrl: item.imageUrl,
    reviewed: Boolean(item.review),
  }));

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const first = items[0];

  let shipment: ShipmentView | null = null;
  if (invoice.shipment) {
    shipment = {
      id: invoice.shipment.id,
      awb: invoice.shipment.awb,
      courierCode: invoice.shipment.courierCode,
      courierName: invoice.shipment.courierName,
      serviceType: serviceName(invoice.shipment.serviceType),
      shippingStatus: invoice.shipment.shippingStatus,
      shippedAt: invoice.shipment.shippedAt?.toISOString() ?? null,
      deliveredAt: invoice.shipment.deliveredAt?.toISOString() ?? null,
      labelUrl: invoice.shipment.labelUrl,
      events: events(invoice.shipment.trackingHistory),
    };
  }

  let dispute: DisputeView | null = null;
  if (invoice.dispute) {
    const evidence = Array.isArray(invoice.dispute.evidenceUrls)
      ? invoice.dispute.evidenceUrls.filter((url): url is string => typeof url === "string")
      : [];
    dispute = {
      id: invoice.dispute.id,
      status: invoice.dispute.status,
      reason: invoice.dispute.reason,
      requestedSolution: invoice.dispute.requestedSolution,
      evidenceUrls: evidence,
      decisionNote: invoice.dispute.decisionNote,
      createdAt: invoice.dispute.createdAt.toISOString(),
      resolvedAt: invoice.dispute.resolvedAt?.toISOString() ?? null,
      messages: invoice.dispute.messages.map((message) => ({
        id: message.id,
        senderName: message.sender.name,
        senderRole: message.senderRole,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }

  const deliveredAt = invoice.deliveredAt;
  const disputeDeadline = deliveredAt
    ? new Date(deliveredAt.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000)
    : null;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    shop: invoice.shop,
    buyerName: invoice.buyer.name,
    orderStatus: invoice.orderStatus,
    escrowStatus: invoice.escrowStatus,
    subtotal: invoice.subtotal,
    shippingCost: invoice.shippingCost,
    serviceFee: invoice.serviceFee,
    totalAmount: invoice.totalAmount,
    courierCode: invoice.courierCode,
    courierName: invoice.courierName,
    courierService: invoice.courierService,
    courierServiceName: serviceName(invoice.courierService),
    weightGram: invoice.weightGram,
    items,
    itemCount,
    firstItemName: first?.name ?? "Pesanan",
    firstItemImage: first?.imageUrl ?? null,
    recipient: {
      name: invoice.recipientName,
      phone: invoice.recipientPhone,
      cityName: invoice.cityName,
      districtName: invoice.districtName,
      postalCode: invoice.postalCode,
      fullAddress: invoice.fullAddress,
    },
    notes: invoice.notes,
    payment: invoice.payment
      ? {
          id: invoice.payment.id,
          method: invoice.payment.method,
          methodLabel: paymentMethodLabel(invoice.payment.method),
          status: invoice.payment.status,
          paymentCode: invoice.payment.paymentCode,
          expiresAt: invoice.payment.expiresAt.toISOString(),
        }
      : null,
    shipment,
    dispute,
    sellerConfirmDeadline: invoice.sellerConfirmDeadline.toISOString(),
    autoCompleteAt:
      invoice.autoCompleteAt?.toISOString() ??
      (deliveredAt
        ? new Date(deliveredAt.getTime() + AUTO_COMPLETE_HOURS * 60 * 60 * 1000).toISOString()
        : null),
    paidAt: invoice.paidAt?.toISOString() ?? null,
    acceptedAt: invoice.acceptedAt?.toISOString() ?? null,
    shippedAt: invoice.shippedAt?.toISOString() ?? null,
    deliveredAt: deliveredAt?.toISOString() ?? null,
    completedAt: invoice.completedAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    canComplete:
      invoice.orderStatus === "DELIVERED" &&
      !invoice.dispute &&
      Boolean(deliveredAt),
    canDispute:
      invoice.orderStatus === "DELIVERED" &&
      !invoice.dispute &&
      Boolean(disputeDeadline) &&
      disputeDeadline !== null &&
      disputeDeadline >= now,
    canReview:
      invoice.orderStatus === "COMPLETED" && items.some((item) => !item.reviewed),
  };
}
