# Skrip Demo Bakul (10 menit)

Demo berjalan penuh di laptop, tanpa akun vendor dan tanpa internet.

## Persiapan

```bash
npm run db:start
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`. Jika data transaksi sudah penuh, jalankan
`npm run demo:reset` lalu mulai ulang `npm run dev` agar jam simulasi dimulai
dari waktu sekarang.

Akun seed memakai kode **123456** selama `DEMO_MODE=true`, termasuk bila
`OTP_DELIVERY=whatsapp`. Nomor seed tidak dikirim ke WhatsApp.

| Peran | Nomor HP | Kode |
| :--- | :--- | :--- |
| Admin | `081200000001` | `123456` |
| Operator demo | `081200000002` | `123456` |
| Penjual Dapur Bu Sri | `081200000011` | `123456` |
| Penjual Keripik Mbok Nah | `081200000012` | `123456` |
| Pembeli Sri Wahyuni | `081200000021` | `123456` |

## Alur 10 menit

| Menit | Langkah | Yang ditunjukkan |
| :--- | :--- | :--- |
| 0–1 | Masuk dengan `081200000011` → `/jualan` | Buka toko tanpa email, OTP demo |
| 1–2 | `/jualan/barang` → Tambah barang + foto | Produk pertama, foto otomatis WebP |
| 2–3 | Masuk pembeli `081200000021` → `/cari` → detail | Katalog, filter, pilihan, ulasan |
| 3–4 | Tambah barang dari dua toko → `/keranjang` → `/bayar` | Keranjang multi-toko, kurir per toko |
| 4–5 | Pilih VA/QRIS → Bayar | 1 pembayaran, N pesanan, hitung mundur |
| 5–6 | `/pembayaran/:id` → “Saya sudah bayar (demo)” | Webhook HMAC, escrow `HELD`, ledger |
| 6–7 | Masuk penjual → `/jualan/pesanan` → Terima → Buat resi → Unduh label | AWB mock, label A6 Code128 |
| 7–8 | Buka `/lacak/:awb` | Timeline pengiriman |
| 8–9 | `/dev` → majukan waktu 33 jam → pembeli “Pesanan selesai” | Auto-complete, escrow dilepas |
| 9–10 | `/jualan/dompet` → tarik saldo → `/admin/pencairan` setujui | Saldo, pencairan, bukti transfer |

## Skenario cadangan: komplain

1. Buat pesanan baru dan majukan waktu sampai `DELIVERED`.
2. Pembeli buka `/pesanan/:id` → **Ajukan komplain**.
3. Isi cerita, pilih solusi, unggah bukti.
4. Penjual membalas di `/jualan/pesanan/:id`.
5. Pembeli meminta admin memutuskan.
6. Admin buka `/admin/komplain`, pilih **Uang kembali sebagian**, isi nominal.
7. Tunjukkan escrow `PARTIALLY_REFUNDED` dan jurnal `ESCROW_PARTIAL_REFUND`
   yang tetap seimbang.

## Demo Console

`/dev` hanya aktif saat `DEMO_MODE=true` dan hanya untuk admin/operator.

- Majukan waktu 1 jam / 24 jam / 48 jam / 72 jam.
- Ubah kecepatan waktu.
- Simulator pembayaran: bayar, gagal, kedaluwarsa.
- Jalankan pemeriksaan SLA sekarang.
- Reset data transaksi.

## Bukti otomatis

```bash
npm run verify:m3   # T-01, T-02
npm run verify:m4   # T-03, T-04, T-05, T-11
npm run verify:m5   # T-06, T-07, label
npm run verify:m6   # T-10, pencairan
npm run verify:m7   # T-08, T-09, T-12
npm run verify:m8   # T-14, demo console, seed
npm run ledger:check
```

Hasil tersimpan di `docs/bukti/`.

## Jika ada yang gagal

- **API tidak hidup**: jalankan `npm run db:start` lalu `npm run dev`.
- **Saldo tidak cukup**: selesaikan satu pesanan lebih dulu atau reset demo.
- **Waktu sudah terlalu jauh**: `npm run demo:reset`, restart `npm run dev`.
- **Foto tidak muncul**: pastikan `storage/products` berisi file; seed membuat
  ulang foto WebP.
