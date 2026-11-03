# ADR 0001 — Fondasi monorepo dan versi toolchain

- Tanggal: 3 November 2026
- Status: diterima
- Konteks: Sprint 3 (M0)

## Keputusan

Repo memakai **npm workspaces** dengan struktur:

- `apps/web` — Next.js App Router
- `apps/api` — NestJS modular
- `packages/shared` — format Rupiah, rumus biaya, tipe/skema bersama
- `packages/config` — `tsconfig` dasar

Versi yang dipasang **exact**:

| Paket | Versi |
| :--- | :--- |
| Next.js | 16.4.4 |
| React / React DOM | 19.3.1 |
| NestJS (`common`, `core`, `platform-express`) | 12.3.2 |
| Prisma CLI / Client / adapter-pg | 7.10.1 |
| Tailwind CSS / PostCSS plugin | 4.3.4 |
| TypeScript | 5.9.3 |
| Vitest | 5.1.0 |

Prisma memakai generator baru `prisma-client` dengan `moduleFormat = "cjs"` dan
driver adapter `@prisma/adapter-pg`, karena Prisma 7 tidak lagi memakai engine
Rust bawaan. Konfigurasi CLI berada di `apps/api/prisma.config.ts`; seed
dijalankan lewat `migrations.seed`.

## Mengapa tidak memakai Nest CLI

`@nestjs/cli` 12 membawa TypeScript 6 dan `@nestjs/schematics` 12 mensyaratkan
`typescript >= 6`. Aturan proyek mengunci TypeScript 5.9.x. Maka:

- runtime Nest tetap 12.3.2;
- kompilasi memakai `tsc` 5.9.3 langsung;
- mode dev memakai `tsc --watch` + `node --watch`, bukan `nest start`;
- tidak ada dependency Nest CLI di repo.

Konsekuensinya, perintah `nest generate` tidak tersedia. File baru dibuat manual
agar struktur tetap kecil dan terkendali.

## Konsekuensi

- `npm install` menjalankan `prisma generate` lewat `postinstall`, sehingga clone
  baru tetap bisa build tanpa langkah tambahan.
- `packages/shared` harus di-build sebelum API/web memakainya. Root `npm run dev`
  dan `npm run build` sudah mengurus urutan ini.
- Vitest dipakai untuk unit test paket shared. Test API/E2E ditambahkan saat ada
  logika yang perlu diuji (Sprint 4+).
- Tailwind 4 memakai `@theme` di `apps/web/app/globals.css`; token desain menjadi
  sumber warna di kode.
