import { OrderDetailClient } from "./order-detail-client";

export default async function PesananDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailClient invoiceId={id} />;
}
