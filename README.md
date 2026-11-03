# Bakul

Pasar daring untuk pedagang kecil Indonesia. Janji utamanya: **uang aman sampai
barang diterima**. Logika transaksi dibangun seperti produksi; perpindahan uang
dan pihak ketiga disimulasikan sepenuhnya di laptop.

Repo ini sudah mencapai **M8 — aplikasi lengkap untuk demo**. Tidak ada akun
vendor, API key, Docker, atau layanan cloud.

## Apa yang sudah jalan

- Login nomor HP + OTP, tanpa email/KTP; sesi aman dengan refresh cookie.
- Buka toko, kelola profil/logo/kurir/rekening, etalase, barang, pilihan, stok,
  foto WebP, dan soft delete.
- Katalog dengan pencarian, filter kategori/kota/harga/rating, urutan, detail
  barang, halaman toko, dan ulasan.
- Keranjang multi-toko, quote ongkir per toko, satu pembayaran untuk beberapa
  pesanan.
- Checkout dengan kunci stok `SELECT ... FOR UPDATE`, `Idempotency-Key`, dan
  pembuatan 1 `payments` + N `order_invoices`.
- Mock payment gateway: VA/QRIS, tanda tangan HMAC, webhook idempoten, dan
  kedaluwarsa yang mengembalikan stok.
- Escrow dan ledger double-entry append-only; `npm run ledger:check` → 0 selisih.
- Penjual terima/tolak, SLA 48 jam, AWB mock, label PDF A6 Code128, dan timeline
  pengiriman.
- Konfirmasi terima, auto-complete 72 jam, saldo toko, tarik saldo, approval
  admin, dan bukti transfer simulasi.
- Pusat komplain: bukti foto/video, ruang diskusi, eskalasi, refund penuh/sebagian,
  retur, dan keputusan admin.
- Dashboard admin: GMV, dana ditahan, pesanan per status, moderasi toko/barang,
  antrean komplain dan pencairan.
- Demo console: time machine, simulator pembayaran, pemeriksaan SLA, reset data.
- Seed 12 pengguna, 5 toko, 100 produk, 30 pesanan historis, dan jurnal ledger.

## Halaman

| Halaman | Route |
| :--- | :--- |
| Beranda katalog | `/` |
| Cari dan filter | `/cari` |
| Detail barang | `/p/:slug` |
| Halaman toko | `/toko/:slug` |
| Keranjang | `/keranjang` |
| Bayar / checkout | `/bayar` |
| Instruksi pembayaran | `/pembayaran/:id` |
| Daftar pesanan | `/pesanan` |
| Detail pesanan | `/pesanan/:id` |
| Pusat komplain | `/pesanan/:id/komplain` |
| Lacak paket | `/lacak/:awb` |
| Buka toko 3 langkah | `/jualan` |
| Kelola barang | `/jualan/barang` |
| Pesanan masuk penjual | `/jualan/pesanan` |
| Dompet dan tarik saldo | `/jualan/dompet` |
| Pengaturan toko | `/jualan/toko` |
| Dashboard admin | `/admin` |
| Pusat resolusi admin | `/admin/komplain` |
| Pencairan admin | `/admin/pencairan` |
| Moderasi toko/barang | `/admin/toko` |
| Demo console | `/dev` |

## Akun demo

Kode OTP selalu **123456** saat `DEMO_MODE=true`.

| Peran | Nomor HP |
| :--- | :--- |
| Admin | `081200000001` |
| Operator demo | `081200000002` |
| Penjual Dapur Bu Sri | `081200000011` |
| Penjual Keripik Mbok Nah | `081200000012` |
| Pembeli Sri Wahyuni | `081200000021` |
| Pembeli Dian Puspita | `081200000022` |

## Prasyarat

- Node.js 24 dan npm 11
- PostgreSQL 17 native (bukan Docker), satu instance lokal
- Windows PowerShell untuk skrip database
- Chrome terpasang jika ingin menjalankan E2E

## 1. Siapkan PostgreSQL

Pasang PostgreSQL native, lalu buat role dan database:

```sql
CREATE ROLE bakul LOGIN PASSWORD 'ganti_password';
CREATE DATABASE bakul_dev OWNER bakul;
```

Repo menyediakan skrip cluster lokal di `%USERPROFILE%\pgsql\17`:

```bash
npm run db:start
npm run db:stop
```

## 2. Konfigurasi

```bash
cp .env.example .env
```

Isi `DATABASE_URL`, `AUTH_JWT_ACCESS_SECRET`, `OTP_PEPPER`, dan `MOCK_PG_SECRET`
dengan nilai lokal. Jangan commit `.env`.

`DEMO_MODE=true` menyalakan OTP demo, Demo Console, dan jam simulasi.
`DEMO_SPEED=60` berarti 1 menit nyata = 1 jam simulasi; ubah lewat `/dev` atau
`.env`.

## 3. Pasang, migrasi, seed

```bash
npm install
npm run db:migrate
npm run db:seed
```

## 4. Jalankan

```bash
npm run dev
```

- Web: <http://localhost:3000>
- API health: <http://localhost:3001/api/v1/health>
- Lewat satu origin: <http://localhost:3000/api/v1/health>
- Swagger: <http://localhost:3001/api/docs>

## Perintah penting

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Web :3000 + API :3001 |
| `npm run build` | Build shared, API, web |
| `npm test` | Unit test shared |
| `npm run test:e2e` | Playwright alur pembeli/penjual/admin |
| `npm run db:generate` | Buat ulang Prisma Client |
| `npm run db:migrate` | Buat/terapkan migrasi pengembangan |
| `npm run db:deploy` | Terapkan migrasi yang ada |
| `npm run db:seed` | Seed katalog + 30 pesanan historis |
| `npm run db:studio` | Prisma Studio |
| `npm run ledger:check` | Periksa invariant ledger |
| `npm run demo:reset` | Kosongkan transaksi lalu isi ulang riwayat demo |
| `npm run verify:m1` | T-12/T-13 auth dan onboarding |
| `npm run verify:m2` | Katalog, foto, etalase, soft delete |
| `npm run verify:m3` | T-01, T-02 keranjang/checkout |
| `npm run verify:m4` | T-03, T-04, T-05, T-11 pembayaran/ledger |
| `npm run verify:m5` | T-06, T-07, AWB, label, tracking |
| `npm run verify:m6` | T-10 dan pencairan |
| `npm run verify:m7` | T-08, T-09, T-12 komplain/admin |
| `npm run verify:m8` | T-14, demo console, seed |

Hasil uji disimpan di `docs/bukti/`. Skrip verifikasi membutuhkan API hidup.

## Bukti dan dokumen

| Dokumen | Isi |
| :--- | :--- |
| `docs/prd/bakul-v0.2.md` | Sumber kebenaran produk |
| `docs/rencana-sprint.md` | Status 12 sprint dan definisi selesai |
| `docs/desain/design.md` | Token, komponen, layar |
| `docs/arsitektur.md` | Diagram sistem dan alur data |
| `docs/model-data.md` | ERD, tabel, constraint, ledger |
| `docs/state-machine.md` | Semua transisi status |
| `docs/demo.md` | Skrip demo 10 menit |
| `docs/adr/` | Alasan keputusan teknis |
| `docs/bukti/` | Output uji T-01…T-14 |
| `docs/bukti/demo-bakul.gif` | GIF ringkas 30 detik dari alur demo |
| `docs/desain/ekspor/implementasi-m8-*.png` | Tangkapan layar implementasi 390 px |

## Keamanan sesi

- Access token hanya di memori browser.
- Refresh token di cookie `httpOnly`, di-hash di database, dan dirotasi.
- Peran dibaca ulang dari database pada setiap request.
- OTP dibatasi 3 permintaan/10 menit dan 5 percobaan per kode.
- Webhook memakai HMAC SHA-256 dan `event_id` unik.
- Semua input API divalidasi Zod.

## Struktur

```text
apps/
  web/        Next.js App Router
  api/        NestJS + Prisma
packages/
  shared/     tipe, Zod, biaya, format Rupiah, kontrak adapter
e2e/          Playwright
scripts/      bantu start/stop PostgreSQL
storage/      foto/bukti/logo lokal (gitignored)
docs/         PRD, desain, ADR, bukti, demo
```

## Batasan yang disengaja

- Semua uang simulasi; tidak ada transfer nyata.
- Satu instance, satu PostgreSQL, tanpa Redis/queue/microservices.
- Tanpa promo, COD, email wajib, live shopping, chat bebas, dark mode, animasi
  berat, atau multi-bahasa.
- Pencarian mengurutkan 100 produk di memori; batas ini dicatat di ADR 0005.
- Label pengiriman dan bukti transfer adalah dokumen simulasi.
- Ledger tidak bisa diubah/dihapus; `demo:reset` mengosongkan tabel transaksi
  secara sengaja dan hanya boleh saat `DEMO_MODE=true`.

Sumber kebenaran: `docs/prd/bakul-v0.2.md`, `docs/desain/design.md`, dan
`docs/rencana-sprint.md`.
