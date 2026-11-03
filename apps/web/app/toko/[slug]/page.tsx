import { ShopClient } from "./shop-client";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ShopClient slug={slug} />;
}
