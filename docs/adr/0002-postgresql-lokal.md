# ADR 0002 — PostgreSQL native lokal

- Tanggal: 3 November 2026
- Status: diterima
- Konteks: Sprint 3 (M0)

## Keputusan

Satu instance **PostgreSQL 17.11 native** berjalan di `127.0.0.1:5432`, tanpa
Docker. Database aplikasi bernama `bakul_dev`, dimiliki role `bakul`.

Lokasi di mesin pengembangan ini:

- Binari: `%USERPROFILE%\pgsql\17`
- Data cluster: `%USERPROFILE%\pgsql\17\data`
- Port: `5432`
- Log: `%USERPROFILE%\pgsql\17\data\postgresql-local.log`

Kata sandi role **tidak ditulis di repo**. Nilainya hanya ada di `.env` yang
di-gitignore. `.env.example` memakai placeholder.

## Catatan pemasangan

Installer EDB dari `get.enterprisedb.com` mengembalikan HTTP 403 dari jaringan
saat pemasangan. Sebagai gantinya dipakai arsip binari Windows resmi EDB yang
ditautkan dari halaman unduhan binari EnterpriseDB:

- `postgresql-17.11-5-windows-x64-binaries.zip`
- SHA-256 diverifikasi sebelum diekstrak:
  `80379B2C04D51C30225532E0AE04509899141E9957ED096FE749D7FD9DF8F82F`

Arsip berisi server, `psql`, dan tool standar. Ini tetap PostgreSQL native dan
lokal; bukan Docker, bukan layanan cloud, dan tidak butuh akun vendor.

Cluster dijalankan dengan `pg_ctl`, bukan Windows Service, agar tidak perlu hak
administrator. Repo menyediakan:

```bash
npm run db:start
npm run db:stop
```

Skrip menerima `PGBIN` dan `PGDATA` bila lokasi instalasi berbeda. Pada mesin
lain, installer resmi PostgreSQL 17 juga bisa dipakai; skrip akan menemukan
`C:\Program Files\PostgreSQL\17\bin` secara otomatis.

## Konsekuensi

- Setelah komputer restart, jalankan `npm run db:start` sebelum `npm run dev`.
- Tidak ada auto-start service. Ini disengaja untuk lingkungan belajar.
- Role `bakul` diberi `CREATEDB` agar Prisma bisa membuat shadow database saat
  `prisma migrate dev`.
- Migrasi menyertakan CHECK untuk harga/stok dan indeks unik parsial untuk satu
  alamat default per pengguna.
