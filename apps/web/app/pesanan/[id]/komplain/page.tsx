import { ComplaintClient } from "./complaint-client";

export default async function KomplainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComplaintClient invoiceId={id} />;
}
