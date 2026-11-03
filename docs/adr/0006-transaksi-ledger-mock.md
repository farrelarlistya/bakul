# ADR 0006 — Checkout, escrow, ledger, dan mock provider

- Tanggal: 3 November 2026
- Status: diterima
- Konteks: Sprint 6–11 (M3–M8)

## Checkout dan stok

- Keranjang disimpan di database (`carts`, `cart_items`) agar pilihan barang dan
  jumlahnya sama di HP maupun desktop.
- `POST /checkout` wajib memakai header `Idempotency-Key`. Kunci disimpan unik di
  `payments`; permintaan ulang dengan kunci yang sama mengembalikan tagihan yang
  sudah ada, bukan membuat tagihan baru.
- Stok dikunci dengan `SELECT ... FOR UPDATE` di dalam transaksi, lalu
  `stock_available` turun dan `stock_reserved` naik. Jika satu barang kurang,
  seluruh transaksi dibatalkan.
- Stok baru dianggap terjual saat pesanan selesai (`stock_reserved` turun).
  Pembatalan mengembalikan stok ke `stock_available`.
- Satu checkout menghasilkan satu `payments` dan satu `order_invoices` per toko.
  Snapshot nama, pilihan, harga, berat, dan foto disimpan di `order_items`.

## Biaya

- Komisi platform 2% dari subtotal barang, dipotong dari hak penjual.
- Biaya layanan pembeli dihitung **per pesanan toko**: Rp1.000 + 0,7% ×
  (barang + ongkir toko). Alasannya, setiap toko adalah invoice terpisah dan
  PRD meminta rincian biaya per toko. Total pembayaran adalah jumlah seluruh
  invoice.
- Biaya payment gateway 0,7% dibebankan ke platform (`PG_FEE_EXPENSE`), bukan
  ke pembeli atau penjual.

## Waktu

- Semua layanan domain memakai `ClockService`. Saat `DEMO_MODE=true`, jam demo
  disimpan di `app_settings` (`demo_epoch`, `demo_started_at`, `demo_speed`) dan
  dapat dimajukan lewat Demo Console.
- `created_at`, `paid_at`, dan waktu resi yang dipakai domain diisi dari
  `ClockService`, bukan jam database, agar status dan timeline tidak melompat
  saat waktu demo dimajukan.
- Scheduler berjalan in-process setiap 5 detik: kedaluwarsa tagihan, SLA penjual
  48 jam, pergerakan resi, dan auto-complete 72 jam.

## Ledger

- Akun: `CASH`, `ESCROW_LIABILITY`, `PLATFORM_REVENUE`, `PG_FEE_EXPENSE`, dan
  `SELLER_PAYABLE:{shop_id}`.
- Setiap jurnal harus seimbang. Database menolak `UPDATE` dan `DELETE` pada
  `ledger_entries` lewat trigger. Satu-satunya pengecualian adalah `TRUNCATE`
  yang dipakai `demo:reset`; ini hanya boleh saat `DEMO_MODE=true`.
- Saldo dompet adalah cache. Sumber kebenaran tetap ledger. `npm run ledger:check`
  memeriksa jurnal seimbang, saldo dompet, saldo escrow, nominal tidak sah, dan
  trigger append-only.
- Refund sebagian dicatat dalam satu jurnal: escrow didebit penuh, lalu dibagi
  ke kas pembeli, utang penjual, dan pendapatan platform.

## Mock payment gateway

- `MockPgService` mengimplementasikan `PaymentProvider`.
- Kode VA mengikuti prefix PRD: BCA `8808`, Mandiri `89508`, BNI `8810`,
  BRI `8899`. QRIS dibangkitkan sebagai payload EMVCo dengan CRC16 dan
  ditampilkan sebagai QR memakai `bwip-js`.
- Webhook ditandatangani
  `X-Mock-Signature: t=<unix>,v1=<HMAC_SHA256(t + "." + rawBody)>`.
  NestJS dijalankan dengan `rawBody: true` agar tanda tangan dihitung dari isi
  asli.
- `webhook_events.event_id` unik. Lima kiriman dengan `event_id` sama hanya
  menghasilkan satu mutasi; pengiriman ulang menerima `200` dengan penanda
  duplikat.
- Respons `payment.paid` mengubah tagihan menjadi `PAID`, invoice menjadi
  `WAITING_SELLER_CONFIRMATION`, escrow menjadi `HELD`, lalu menulis jurnal.

## Pengiriman

- Tarif mock berbasis zona kota/provinsi/pulau, berat dibulatkan ke atas per kg,
  dan pengali kurir/layanan sesuai PRD.
- AWB deterministik dari hash `invoice_id`, sehingga dapat diulang saat uji.
- Label A6 dibuat dengan `pdfkit`; barcode Code128 dan QR memakai `bwip-js`.
  Keduanya dependency nyata karena PRD mewajibkan label PDF dan QR, bukan
  sekadar teks.
- Timeline resi dihitung dari waktu AWB dibuat dan diperbarui scheduler.

## Pengujian

- `@playwright/test` ditambahkan sebagai dev dependency untuk E2E. Browser yang
  dipakai adalah Chrome yang sudah terpasang (`channel: "chrome"`), sehingga
  tidak perlu mengunduh browser Playwright.
- Skrip `verify:m3` sampai `verify:m8` menguji API dan database nyata; hasilnya
  disimpan di `docs/bukti/`.

## Konsekuensi

- Ledger tidak bisa “dirapikan” dengan update/delete. Koreksi harus berupa jurnal
  baru.
- Demo reset mengosongkan seluruh tabel transaksi. Ini disengaja untuk demo dan
  tidak boleh dijalankan di produksi.
- Biaya layanan per toko membuat pembeli membayar flat Rp1.000 untuk setiap toko
  dalam satu pembayaran. Keputusan ini mudah diubah jika pemilik memilih satu
  biaya layanan per pembayaran.
- Mock provider tidak memanggil jaringan eksternal; seluruh alur dapat berjalan
  tanpa akun vendor.
