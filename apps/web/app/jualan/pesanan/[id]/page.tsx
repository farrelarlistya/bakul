import { SellerOrderDetailClient } from "./seller-order-detail-client";

export default async function SellerOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SellerOrderDetailClient invoiceId={id} />;
}
