# ADR 0008 — Tunnel Cloudflare untuk demo lintas perangkat

- Tanggal: 4 November 2026
- Status: diterima
- Konteks: demo M9, kebutuhan membuka aplikasi dari HP/tablet

## Konteks

Bakul adalah monolith yang berjalan di satu laptop: Next.js :3000, NestJS :3001,
dan PostgreSQL native lokal. Untuk demo, aplikasi perlu dibuka dari perangkat
lain tanpa memindahkan database atau menambah layanan cloud.

## Keputusan

- Menambah perintah `npm run share` yang menjalankan Cloudflare Quick Tunnel
  (`cloudflared tunnel --url http://127.0.0.1:3000`).
- Hanya port web yang dibuka. API tetap diakses lewat rewrite `/api/*` milik
  Next.js, jadi tidak ada port API yang terekspos langsung.
- `cloudflared` bukan dependency npm. Biner diunduh sesuai kebutuhan ke
  `%LOCALAPPDATA%\bakul\cloudflared.exe`, di luar repo, dan tidak di-commit.
- Origin `*.trycloudflare.com` ditambahkan ke `allowedDevOrigins` agar aset dev
  dan HMR tidak diblokir saat halaman dibuka lewat tunnel.

## Alternatif yang ditolak

- **Deploy ke Cloudflare Pages/Workers.** API NestJS, Prisma, dan PostgreSQL
  native tidak cocok dengan runtime Workers; memindahkannya berarti mengganti
  arsitektur yang sudah dikunci di ADR 0001 dan ADR 0002.
- **Membuka port router / port forwarding.** Membocorkan laptop ke internet
  tanpa HTTPS dan tanpa kontrol akses, serta bergantung pada konfigurasi router.
- **Hanya IP lokal.** Cukup di Wi-Fi yang sama, tetapi tidak bisa dipakai untuk
  demo jarak jauh atau saat perangkat memakai jaringan seluler.
- **Named tunnel.** Tautan tetap, tetapi memerlukan akun Cloudflare dan domain
  sendiri. Bisa ditambahkan nanti tanpa mengubah aplikasi.

## Konsekuensi

- Tautan quick tunnel berganti setiap kali dijalankan dan hanya hidup selama
  proses `cloudflared` terbuka.
- Tautan bersifat publik. Saat `DEMO_MODE=true`, OTP `123456` dan akun admin demo
  bisa diakses siapa pun yang memegang tautan. Tunnel hanya untuk demo, bukan
  produksi.
- Laptop harus menyala, dan kualitas demo bergantung pada koneksi internet.
- Tidak ada perubahan pada skema database, API, atau kontrak frontend.
