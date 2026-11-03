export type OrderTotalsInput = {
  subtotalItems: number;
  shippingCost: number;
};

export type OrderTotals = {
  subtotalItems: number;
  shippingCost: number;
  serviceFee: number;
  platformFee: number;
  netSellerAmount: number;
  totalAmount: number;
};

function assertRupiah(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} harus integer rupiah dan tidak negatif.`);
  }
}

/**
 * Biaya layanan pembeli: Rp1.000 + 0,7% dari (barang + ongkir).
 * Pembulatan ke rupiah terdekat.
 */
export function calculateServiceFee(subtotalItems: number, shippingCost: number): number {
  assertRupiah(subtotalItems, "Subtotal");
  assertRupiah(shippingCost, "Ongkir");

  return 1_000 + Math.round(((subtotalItems + shippingCost) * 7) / 1_000);
}

/**
 * Komisi platform 2% dari nilai barang. Tidak ditampilkan ke pembeli.
 */
export function calculatePlatformFee(subtotalItems: number): number {
  assertRupiah(subtotalItems, "Subtotal");

  return Math.round((subtotalItems * 2) / 100);
}

/**
 * Hak penjual: barang + ongkir - komisi platform.
 */
export function calculateNetSellerAmount(subtotalItems: number, shippingCost: number): number {
  assertRupiah(subtotalItems, "Subtotal");
  assertRupiah(shippingCost, "Ongkir");

  return subtotalItems + shippingCost - calculatePlatformFee(subtotalItems);
}

export function calculateTotals({ subtotalItems, shippingCost }: OrderTotalsInput): OrderTotals {
  const serviceFee = calculateServiceFee(subtotalItems, shippingCost);
  const platformFee = calculatePlatformFee(subtotalItems);

  return {
    subtotalItems,
    shippingCost,
    serviceFee,
    platformFee,
    netSellerAmount: subtotalItems + shippingCost - platformFee,
    totalAmount: subtotalItems + shippingCost + serviceFee,
  };
}
