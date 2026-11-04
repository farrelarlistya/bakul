# Bakul

Pasar daring untuk pedagang kecil Indonesia. Janji utamanya: **uang aman sampai
barang diterima**. Logika transaksi dibangun seperti produksi; perpindahan uang
dan pihak ketiga disimulasikan sepenuhnya di laptop.

Repo ini sudah mencapai **M10 — aplikasi lengkap untuk demo**. Versi paket
`0.1.0`. Tidak ada akun vendor wajib, API key, Docker, atau layanan cloud.

## Apa yang sudah jalan

- Login nomor HP + OTP, tanpa email/KTP; sesi aman dengan refresh cookie.
- OTP WhatsApp asli sebagai opsi demo internal lewat Fonnte; default tetap kode
  demo `123456`.
- Daftar akun pembeli tanpa diminta membuka toko; buka toko terpisah di
  `/jualan`.
- Beranda dengan hero, kategori, toko pilihan, barang baru, jelajahi kota, dan
  katalog terlaris.
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
- Berbagi demo ke perangkat lain lewat Cloudflare Quick Tunnel (`npm run share`).
- Seed 10 pengguna (1 admin, 8 penjual satu per kategori, 1 pembeli), 8 toko, 32 produk dengan foto masing-masing. Riwayat transaksi sengaja kosong.

## Halaman

| Halaman | Route |
| :--- | :--- |
| Beranda katalog | `/` |
| Masuk dan daftar pembeli | `/masuk` |
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

Kode OTP selalu **123456** saat `OTP_DELIVERY=demo` (nilai default bila
`DEMO_MODE=true`).

Pembeli baru bisa mendaftar lewat `/masuk` → **Daftar**. Registrasi ini hanya
membuat akun pembeli tanpa toko; untuk berjualan, buka `/jualan` setelah punya
akun.

| Peran | Nomor HP |
| :--- | :--- |
| Admin Bakul | `081200000001` |
| Sri Rahayu — Dapur Bu Sri | `081200000011` |
| Nah Rowiyah — Keripik Mbok Nah | `081200000012` |
| Asep Hidayat — Sembako Asep Jaya | `081200000013` |
| Yanto Wibowo — Kopi Lereng Tangsi | `081200000014` |
| Sekar Arum — Batik Sekar Arum | `081200000015` |
| Bagus Setiawan — Anyaman Nusantara | `081200000016` |
| Lestari Ningsih — Rempah Ayu | `081200000017` |
| Dian Puspita — Rumah Tangga Sejahtera | `081200000018` |
| Sri Wahyuni — pembeli | `081200000021` |

## Prasyarat

- Node.js 24 dan npm 11
- PostgreSQL 17 native (bukan Docker), satu instance lokal
- Windows PowerShell untuk skrip database
- Opsional: akun Fonnte jika ingin OTP WhatsApp sungguhan

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

`DEMO_MODE=true` menyalakan Demo Console dan jam simulasi.
`DEMO_SPEED=60` berarti 1 menit nyata = 1 jam simulasi; ubah lewat `/dev` atau
`.env`. Pengiriman OTP diatur terpisah lewat `OTP_DELIVERY` (`demo` atau
`whatsapp`).

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

## 5. Buka dari perangkat lain

Cara tercepat: **Cloudflare Quick Tunnel**. Tidak perlu akun Cloudflare dan
tidak perlu membuka port router. Aplikasi tetap berjalan di laptop ini.

1. Nyalakan aplikasi seperti biasa di terminal pertama:

   ```bash
   npm run dev
   ```

2. Di terminal kedua, buka tunnel:

   ```bash
   npm run share
   ```

3. Tunggu baris `https://....trycloudflare.com`, lalu buka tautan itu di HP,
   tablet, atau laptop lain.

Yang perlu diketahui:

- Tautan **publik**: siapa pun yang memegangnya bisa membuka Bakul, termasuk
  `/dev` dan akun admin demo. Bagikan hanya selama demo, lalu tutup dengan
  `Ctrl+C`.
- Tautan **berganti** setiap kali `npm run share` dijalankan. Untuk tautan tetap,
  pakai named tunnel Cloudflare dengan domain sendiri (perlu akun Cloudflare).
- Laptop harus tetap menyala dan terhubung internet; tunnel hanya meneruskan
  lalu lintas ke `http://127.0.0.1:3000`.
- `cloudflared` diunduh otomatis ke `%LOCALAPPDATA%\bakul` saat pertama dipakai.
- Tidak ada deploy ke Cloudflare Pages: API NestJS dan PostgreSQL tetap lokal,
  sesuai ADR 0002 dan ADR 0008.

## 6. OTP WhatsApp (opsional)

Untuk demo internal dengan kode OTP sungguhan, Bakul bisa mengirim 6 angka lewat
WhatsApp memakai Fonnte. Default repo tetap mode demo (`123456`).

1. Buat akun di <https://fonnte.com>, hubungkan nomor WhatsApp yang dipakai
   sebagai pengirim, lalu salin token perangkat.
2. Isi `.env`:

   ```env
   OTP_DELIVERY=whatsapp
   NOTIFIER_PROVIDER=fonnte
   FONNTE_TOKEN="token_dari_fonnte"
   ```

3. Jalankan ulang `npm run dev` supaya API membaca env baru.
4. Uji pengiriman ke nomor sendiri:

   ```bash
   npm run otp:test -- 08xxxxxxxxxx
   ```

5. Login atau daftar memakai nomor itu. Kode dikirim ke WhatsApp, bukan
   ditampilkan di layar. `DEMO_MODE=true` boleh tetap menyala untuk Demo Console
   dan time machine.

Catatan:

- `FONNTE_TOKEN` adalah rahasia. Jangan commit `.env`.
- Fonnte adalah gateway WhatsApp, bukan WhatsApp Business API resmi. Kualitas
  dan kuota pengiriman mengikuti layanan mereka.
- Untuk kembali ke mode demo: `OTP_DELIVERY=demo` dan `NOTIFIER_PROVIDER=mock`.
- Halaman Masuk hanya untuk nomor yang sudah terdaftar. Nomor baru bisa mendaftar
  lewat tombol **Daftar** di `/masuk`; untuk berjualan, buka `/jualan` setelah
  punya akun.

## Perintah penting

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Web :3000 + API :3001 |
| `npm run share` | Buka tautan publik sementara lewat Cloudflare Quick Tunnel |
| `npm run build` | Build shared, API, web |
| `npm test` | Unit test Vitest (shared) |
| `npm run db:generate` | Buat ulang Prisma Client |
| `npm run db:migrate` | Buat/terapkan migrasi pengembangan |
| `npm run db:deploy` | Terapkan migrasi yang ada |
| `npm run db:seed` | Seed katalog: 8 toko, 32 produk, tanpa transaksi |
| `npm run db:studio` | Prisma Studio |
| `npm run ledger:check` | Periksa invariant ledger |
| `npm run demo:reset` | Kosongkan transaksi, sesi, dan OTP; katalog/akun tetap |
| `npm run otp:test -- 08xxx` | Kirim pesan uji WhatsApp lewat Fonnte |
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
| `docs/rencana-sprint.md` | Status sprint dan definisi selesai |
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
scripts/      start/stop PostgreSQL, Cloudflare share
storage/      foto/bukti/logo lokal (gitignored)
docs/         PRD, desain, ADR, bukti, demo
```

## Batasan yang disengaja

- Semua uang simulasi; tidak ada transfer nyata.
- Satu instance, satu PostgreSQL, tanpa Redis/queue/microservices.
- Tanpa promo, COD, email wajib, live shopping, chat bebas, dark mode, animasi
  berat, atau multi-bahasa.
- Pencarian mengurutkan 32 produk di memori; batas ini dicatat di ADR 0005.
- Label pengiriman dan bukti transfer adalah dokumen simulasi.
- Ledger tidak bisa diubah/dihapus; `demo:reset` mengosongkan tabel transaksi
  secara sengaja dan hanya boleh saat `DEMO_MODE=true`.

Sumber kebenaran: `docs/prd/bakul-v0.2.md`, `docs/desain/design.md`, dan
`docs/rencana-sprint.md`.
