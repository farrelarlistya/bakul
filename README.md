# Bakul

Pasar daring untuk pedagang kecil Indonesia. Janji utamanya: **uang aman sampai
barang diterima**. Logika transaksi dibuat seperti produksi; perpindahan uang dan
pihak ketiga disimulasikan.

Repo ini sedang di tahap **M1 — akun dan onboarding**. Yang sudah ada: fondasi
monorepo, PostgreSQL lokal, login nomor HP + kode demo, profil, alamat, buka toko,
barang pertama dengan foto, dan Inbox. Katalog dan pembayaran belum dibuat.

## Yang bisa dicoba

- `/masuk` — masuk dengan nomor HP dan kode 6 angka.
- `/jualan` — buka toko 3 langkah lalu unggah barang pertama.
- `/akun` — ubah profil dan kelola alamat.
- `/inbox` — baca kode masuk dan pesan Bakul.

Saat `DEMO_MODE=true`, kode selalu **123456** dan tampil di layar/inbox. Tidak ada
email, password, atau KTP untuk alur utama.

Akun seed untuk mencoba:

| Peran | Nomor HP |
| :--- | :--- |
| Admin | `081200000001` |
| Penjual | `081200000011` |
| Pembeli | `081200000021` |

## Prasyarat

- Node.js 24 dan npm 11
- PostgreSQL 17 native (bukan Docker), satu instance lokal
- Windows PowerShell untuk skrip database

## 1. Siapkan PostgreSQL

Pasang PostgreSQL native, lalu buat role dan database:

```sql
CREATE ROLE bakul LOGIN PASSWORD 'ganti_password';
CREATE DATABASE bakul_dev OWNER bakul;
```

Di Windows, PostgreSQL 17 biasanya berada di
`C:\Program Files\PostgreSQL\17`. Repo ini juga menyediakan skrip untuk cluster
lokal di `%USERPROFILE%\pgsql\17`:

```bash
npm run db:start
npm run db:stop
```

Skrip menerima `PGBIN` dan `PGDATA` bila lokasi instalasimu berbeda.

## 2. Konfigurasi

```bash
cp .env.example .env
```

Isi `DATABASE_URL` dengan password PostgreSQL milikmu. Isi juga
`AUTH_JWT_ACCESS_SECRET` dan `OTP_PEPPER` dengan nilai acak 64 karakter hex.
`AUTH_REFRESH_DAYS` default 7 hari. Jangan commit `.env`.

## 3. Pasang, migrasi, seed

```bash
npm install
npm run db:migrate
npm run db:seed
```

`npm install` otomatis menjalankan `prisma generate`.

## 4. Jalankan

```bash
npm run dev
```

- Web: <http://localhost:3000>
- API health: <http://localhost:3001/api/v1/health>
- Lewat satu origin: <http://localhost:3000/api/v1/health>
- Dokumentasi API: <http://localhost:3001/api/docs>

Alamat `127.0.0.1:3000` juga bisa dipakai; `localhost` lebih aman untuk konsistensi
cookie saat pengembangan.

## Keamanan sesi

- Access token hanya disimpan di memori browser.
- Refresh token ada di cookie `httpOnly`, tidak bisa dibaca JavaScript.
- Refresh token di database disimpan sebagai hash dan dirotasi saat dipakai.
- Peran dicek ulang dari database pada setiap request terlindungi.
- OTP dibatasi 3 permintaan per 10 menit dan 5 percobaan per kode.

## Perintah penting

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Web :3000 + API :3001 |
| `npm run build` | Build shared, API, lalu web |
| `npm test` | Unit test paket shared |
| `npm run db:generate` | Buat ulang Prisma Client |
| `npm run db:migrate` | Jalankan migrasi baru |
| `npm run db:deploy` | Terapkan migrasi yang sudah ada |
| `npm run db:seed` | Isi 12 pengguna, 5 toko, 8 kategori, 100 produk |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run verify:m1` | Uji T-12/T-13 dan tulis hasil ke `docs/bukti/m1-auth.txt` |

## Struktur

```
apps/
  web/        Next.js App Router (pembeli, penjual, admin)
  api/        NestJS + Prisma
packages/
  shared/     format Rupiah, biaya, tipe, skema Zod, wilayah
  config/     tsconfig dasar
scripts/      bantu start/stop PostgreSQL lokal
storage/      foto produk lokal (gitignored)
docs/         PRD, desain, rencana sprint, ADR, bukti
```

## Aturan yang mengikat

- Login dengan nomor HP + OTP. Email opsional; password hanya admin/operator demo.
- Uang integer rupiah. Tidak ada `float` untuk uang.
- Waktu domain lewat `ClockService`; jangan `new Date()` di lapisan domain.
- Ledger append-only; belum dibuat.
- Vendor lewat adapter; belum dibuat.
- Foto produk disimpan lokal di `storage/products`, maksimal 2 MB.
- Tanpa Docker, Redis, queue, microservices, promo, atau dark mode.
- Teks minimal 16 px, target sentuh 44 px, kontras minimal 4,5:1.

Sumber kebenaran: `docs/prd/bakul-v0.2.md`, `docs/desain/design.md`, dan
`docs/rencana-sprint.md`.
