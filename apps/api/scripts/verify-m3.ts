import assert from "node:assert/strict";
import {
  addToCart,
  adminToken,
  advanceClock,
  api,
  checkoutCart,
  cleanupInvoices,
  login,
  prisma,
  sellerAcceptAndShip,
  variantForShop,
  waitFor,
} from "./verify-utils";

const BUYER = "081200000021";
const TEST_NAME = "Barang Uji T-02";

async function cleanupTestProduct(): Promise<void> {
  const products = await prisma.product.findMany({
    where: { name: TEST_NAME },
    select: { id: true },
  });
  const productIds = products.map((product) => product.id);
  if (productIds.length === 0) {
    return;
  }

  const invoices = await prisma.orderInvoice.findMany({
    where: { items: { some: { productId: { in: productIds } } } },
    select: { id: true },
  });
  await cleanupInvoices(invoices.map((invoice) => invoice.id));
  await prisma.cartItem.deleteMany({
    where: { variant: { productId: { in: productIds } } },
  });
  await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
}

async function main(): Promise<void> {
  await cleanupTestProduct();
  const buyer = await login(BUYER);
  const admin = await adminToken();

  // T-01: satu pembayaran untuk dua toko.
  const first = await variantForShop("081200000011");
  const second = await variantForShop("081200000012");
  await addToCart(buyer.token, first.variantId, 1);
  await addToCart(buyer.token, second.variantId, 2);
  const multi = await checkoutCart(buyer.token);

  const payment = await prisma.payment.findUnique({
    where: { id: multi.result.paymentId },
    include: { invoices: true },
  });
  assert.ok(payment);
  assert.equal(multi.shopCount, 2);
  assert.equal(multi.result.invoiceCount, 2);
  assert.equal(payment.invoices.length, 2);
  const invoiceSum = payment.invoices.reduce(
    (total, invoice) => total + invoice.totalAmount,
    0,
  );
  assert.equal(invoiceSum, payment.totalAmount);
  assert.equal(new Set(payment.invoices.map((invoice) => invoice.shopId)).size, 2);

  const replay = await api<{ paymentId: string }>("/checkout", {
    method: "POST",
    token: buyer.token,
    headers: { "Idempotency-Key": payment.idempotencyKey },
    body: {
      addressId: (await api<{ id: string; isDefault: boolean }[]>("/me/addresses", {
        token: buyer.token,
      })).body[0]?.id,
      paymentMethod: payment.method,
      shipping: payment.invoices.map((invoice) => ({
        shopId: invoice.shopId,
        courier: invoice.courierCode,
        service: invoice.courierService,
      })),
    },
  });
  assert.equal(replay.body.paymentId, payment.id);

  console.log(
    `PASS T-01: 1 pembayaran (${payment.totalAmount}) untuk ${payment.invoices.length} pesanan toko; kirim ulang kunci yang sama tidak menggandakan tagihan.`,
  );

  await api(`/demo/payments/${payment.id}/expire`, { method: "POST", token: admin });
  await waitFor(async () => {
    const row = await prisma.payment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });
    return row?.status === "EXPIRED";
  });
  await cleanupInvoices(multi.invoiceIds);

  // T-02: stok 1 dibeli 100 paralel.
  const seller = await login("081200000011");
  const categories = await api<{ id: string }[]>("/categories");
  const created = await api<{
    id: string;
    variants: { id: string }[];
  }>("/seller/products", {
    method: "POST",
    token: seller.token,
    body: {
      name: TEST_NAME,
      categoryId: categories.body[0]?.id,
      description: "Barang khusus uji konkurensi stok.",
      weightGram: 500,
      variants: [{ name: "Satu", price: 12_000, stockAvailable: 1 }],
    },
  });
  assert.equal(created.status, 201);
  const variantId = created.body.variants[0]?.id;
  assert.ok(variantId);

  await addToCart(buyer.token, variantId, 1);
  const address = await api<{ id: string; isDefault: boolean }[]>("/me/addresses", {
    token: buyer.token,
  });
  const addressId = (address.body.find((item) => item.isDefault) ?? address.body[0])?.id;
  assert.ok(addressId);
  const quote = await api<{
    shops: { shopId: string; rates: { courier: string; service: string }[] }[];
  }>("/checkout/quote", { method: "POST", token: buyer.token, body: { addressId } });
  const shop = quote.body.shops[0];
  const rate = shop?.rates[0];
  assert.ok(shop && rate);

  const before = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stockAvailable: true, stockReserved: true },
  });
  assert.equal(before?.stockAvailable, 1);
  assert.equal(before?.stockReserved, 0);

  const started = Date.now();
  const attempts = await Promise.all(
    Array.from({ length: 100 }, (_, index) =>
      api<{ paymentId: string }>("/checkout", {
        method: "POST",
        token: buyer.token,
        headers: { "Idempotency-Key": `t02-${Date.now()}-${index}` },
        body: {
          addressId,
          paymentMethod: "VA_BCA",
          shipping: [
            { shopId: shop.shopId, courier: rate.courier, service: rate.service },
          ],
        },
      }),
    ),
  );

  const successes = attempts.filter((attempt) => attempt.status === 201);
  const conflicts = attempts.filter((attempt) => attempt.status === 409);
  const emptyCart = attempts.filter(
    (attempt) =>
      attempt.status === 400 &&
      (attempt.body as { error?: { code?: string } })?.error?.code === "CART_EMPTY",
  );
  assert.equal(successes.length, 1, "hanya satu checkout boleh berhasil");
  assert.equal(conflicts.length + emptyCart.length, 99);

  const after = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stockAvailable: true, stockReserved: true },
  });
  assert.equal(after?.stockAvailable, 0);
  assert.equal(after?.stockReserved, 1);

  console.log(
    `PASS T-02: 100 checkout paralel pada stok 1 -> ${successes.length} sukses, ${conflicts.length} ditolak stok, ${emptyCart.length} keranjang kosong dalam ${Date.now() - started} ms.`,
  );

  const successPaymentId = successes[0]?.body.paymentId;
  assert.ok(successPaymentId);
  await api(`/demo/payments/${successPaymentId}/expire`, {
    method: "POST",
    token: admin,
  });
  await waitFor(async () => {
    const row = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stockAvailable: true, stockReserved: true },
    });
    return row?.stockAvailable === 1 && row?.stockReserved === 0;
  });

  console.log("PASS T-05 awal: tagihan uji kedaluwarsa mengembalikan stok 1 -> 0 -> 1.");

  const invoices = await prisma.orderInvoice.findMany({
    where: { items: { some: { productId: created.body.id } } },
    select: { id: true },
  });
  await cleanupInvoices(invoices.map((invoice) => invoice.id));
  await prisma.cartItem.deleteMany({ where: { variantId } });
  await prisma.productImage.deleteMany({ where: { productId: created.body.id } });
  await prisma.productVariant.deleteMany({ where: { id: variantId } });
  await prisma.product.delete({ where: { id: created.body.id } });
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M3:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
