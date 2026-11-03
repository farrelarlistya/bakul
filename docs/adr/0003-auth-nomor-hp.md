# ADR 0003 — Autentikasi nomor HP, OTP, dan sesi

- Tanggal: 3 November 2026
- Status: diterima
- Konteks: Sprint 4 (M1)

## Keputusan

Login memakai **nomor HP + OTP 6 angka**. Tidak ada login password untuk pembeli
atau penjual. Email opsional dan tidak dipakai untuk masuk.

Alur:

1. `POST /auth/register` atau `POST /auth/login` meminta kode.
2. OTP disimpan di `otp_codes` sebagai HMAC-SHA256 dengan `OTP_PEPPER`.
3. Kode berlaku 10 menit. Maksimal 3 permintaan per 10 menit per nomor dan 5
   percobaan per kode.
4. `POST /auth/verify-otp` membuat sesi dan memasang cookie refresh.
5. `POST /auth/refresh` merotasi refresh token.
6. `POST /auth/logout` mencabut sesi dan menghapus cookie.

Pada `DEMO_MODE=true`, kode selalu `123456` dan ditampilkan di UI serta Inbox.
Di luar mode demo, kode tidak pernah dikirim ke response.

## Sesi

- Access token JWT berlaku 15 menit dan **hanya disimpan di memori** React.
- Refresh token adalah string acak 32 byte, bukan JWT. Nilainya tidak disimpan di
  database; yang disimpan hanya SHA-256 hash-nya.
- Refresh token ada di cookie `httpOnly`, `SameSite=Lax`, path `/api/v1/auth`.
  Pada produksi ditambah `Secure`.
- Cookie penanda `bakul_has_session=1` (bukan httpOnly, tanpa token) dipakai UI
  untuk menghindari request refresh yang pasti gagal saat pengguna tamu.
- Refresh token dirotasi pada setiap pemakaian; token lama dicabut.
- Setiap request terlindungi memverifikasi JWT lalu membaca ulang peran pengguna
  dari database. Dengan begitu perubahan `BUYER` → `SELLER` setelah buka toko
  langsung berlaku tanpa menunggu access token baru.

## Otorisasi

- `JwtAuthGuard` menolak request tanpa Bearer token yang valid.
- `RolesGuard` menolak peran yang tidak sesuai dengan `403`.
- Endpoint penjual memakai `@Roles("SELLER")`; endpoint admin memakai
  `@Roles("ADMIN")`.
- Alamat selalu difilter dengan `userId` pemilik; alamat pengguna lain menghasilkan
  `404`.
- `OPERATOR_DEMO` ditolak bila `DEMO_MODE` tidak aktif.

## Konsekuensi

- Tidak memakai Passport; guard ditulis langsung agar alurnya eksplisit dan
  dependency tetap kecil.
- Sesi disimpan di PostgreSQL, jadi restart API tidak menghapus sesi.
- Logout hanya mencabut sesi perangkat itu; sesi lain tetap berlaku.
- Rotasi refresh berarti satu cookie lama tidak bisa dipakai dua kali. Jika ada
  dua tab yang melakukan refresh bersamaan, salah satu bisa mendapat `401` dan
  perlu login ulang. Untuk aplikasi lokal satu tab, ini dapat diterima.
