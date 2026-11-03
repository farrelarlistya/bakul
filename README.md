# Bakul

Pasar daring untuk pedagang kecil Indonesia. Janji utamanya: **uang aman sampai
barang diterima**. Logika transaksi dibuat seperti produksi; perpindahan uang dan
pihak ketiga disimulasikan.

Repo ini sedang di tahap **M0 — fondasi teknis**. Belum ada login, katalog, atau
pembayaran. Yang sudah ada: monorepo, PostgreSQL lokal, API health, Prisma, seed,
dan token desain di Tailwind.

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

Isi `DATABASE_URL` dengan password PostgreSQL milikmu. Jangan commit `.env`.

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

- Web: <http://127.0.0.1:3000>
- API health: <http://127.0.0.1:3001/api/v1/health>
- Lewat satu origin: <http://127.0.0.1:3000/api/v1/health>
- Dokumentasi API: <http://127.0.0.1:3001/api/docs>

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

## Struktur

```
apps/
  web/        Next.js App Router (pembeli, penjual, admin)
  api/        NestJS + Prisma
packages/
  shared/     format Rupiah, biaya pesanan, tipe bersama
  config/     tsconfig dasar
scripts/      bantu start/stop PostgreSQL lokal
docs/         PRD, desain, rencana sprint, ADR, bukti
```

## Aturan yang mengikat

- Login dengan nomor HP + OTP. Email opsional; password hanya admin/operator demo.
- Uang integer rupiah. Tidak ada `float` untuk uang.
- Waktu domain lewat `ClockService`; jangan `new Date()` di lapisan domain.
- Ledger append-only; belum dibuat di M0.
- Vendor lewat adapter; belum dibuat di M0.
- Tanpa Docker, Redis, queue, microservices, promo, atau dark mode.
- Teks minimal 16 px, target sentuh 44 px, kontras minimal 4,5:1.

Sumber kebenaran: `docs/prd/bakul-v0.2.md`, `docs/desain/design.md`, dan
`docs/rencana-sprint.md`.
