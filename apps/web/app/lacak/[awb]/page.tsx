import { TrackingClient } from "./tracking-client";

export default async function LacakPage({
  params,
}: {
  params: Promise<{ awb: string }>;
}) {
  const { awb } = await params;
  return <TrackingClient awb={awb} />;
}
