# Rencana Sprint — Bakul

| Atribut | Detail |
| :--- | :--- |
| Versi dokumen | 1.0 |
| Tanggal | 3 November 2026 |
| Status | Sprint 0–4 selesai · Sprint 5 berikutnya |
| Sumber kebenaran produk | `docs/prd/bakul-v0.2.md` |
| Sumber kebenaran visual | `docs/desain/design.md` + `docs/desain/referensi/referensiStyleDesign.jpg` |
| Berkas lokal (tidak di Git) | `AGENTS.md`, `bakul.figcraft` |
| Berkas bukti desain | `docs/desain/ekspor/` |

---

## 1. Konteks singkat

**Bakul** adalah pasar daring untuk pedagang kecil Indonesia. Janji utamanya:
buka toko tanpa email, uang pembeli ditahan sampai barang diterima, dan pesanan rapi
tanpa buku catatan. Persona penguji adalah **Ibu Sri**, pedagang warung + kue kering
di Sleman, 43 tahun, tanpa email, HP Android RAM 3 GB.

Prinsip teknis: **logika asli, uang simulasi**. Escrow, ledger, stok, dan state machine
dibangun sebenar produksi; hanya perpindahan uang dan pihak ketiga yang mock.

Keputusan yang sudah dikunci (jangan dibuka ulang tanpa persetujuan pemilik):

- Login **OTP nomor HP saja**; password hanya untuk admin/operator demo.
- **PostgreSQL native**, bukan Docker/cloud.
- Monolith modular: Next.js + NestJS + Prisma; satu origin via rewrite `/api`.
- Uang integer rupiah; waktu lewat `ClockService`; ledger append-only.
- Teks ≥ 16 px, target sentuh ≥ 44 px, kontras ≥ 4,5:1.
- Dilarang: promo/diskon, kolom email, COD, live shopping, chat bebas, dark mode,
  Redis/queue, microservices.

---

## 2. Cara memakai dokumen ini

Untuk agent yang baru masuk:

1. Baca `AGENTS.md` (aturan kerja).
2. Baca bagian PRD yang relevan dengan sprint aktif — jangan seluruh dokumen.
3. Baca sprint aktif di dokumen ini.
4. Jika menyentuh UI, baca `docs/desain/design.md`.

Aturan kerja:

- **Satu sprint = satu tujuan yang bisa didemokan.**
- Jangan mulai sprint berikutnya sebelum "Definisi selesai" sprint aktif terpenuhi.
- Setiap akhir sprint: perbarui papan status, commit, push, lalu tag.
- Jika lingkup berubah, ubah dokumen ini **dulu**, baru kode.
- Jangan menghapus riwayat sprint; tambahkan catatan di bagian "Catatan".

---

## 3. Papan status

| Sprint | Fokus | Status | Tag |
| :--- | :--- | :--- | :--- |
| 0 | Fondasi repo + sistem desain + Beranda | **Selesai** | `desain-d1-rev1` |
| 1 | Desain alur pembeli inti (D2) | **Selesai** | `desain-d2` |
| 2 | Desain pesanan, onboarding penjual, inbox (D3) | **Selesai** | `desain-v1` |
| 3 | Fondasi teknis / M0 | **Selesai** | `m0-selesai` |
| 4 | Akun & onboarding / M1 | **Selesai** | `m1-selesai` |
| 5 | Katalog & toko / M2 | Berikutnya | `m2-selesai` |
| 6 | Keranjang & checkout / M3 | Belum | `m3-selesai` |
| 7 | Pembayaran, escrow, ledger / M4 | Belum | `m4-selesai` |
| 8 | Pemenuhan & pengiriman / M5 | Belum | `m5-selesai` |
| 9 | Dompet & pencairan / M6 | Belum | `m6-selesai` |
| 10 | Pusat Resolusi & admin / M7 | Belum | `m7-selesai` |
| 11 | Poles, bukti, demo / M8 | Belum | `m8-selesai` |

---

## Sprint 0 — Fondasi repo & sistem desain

**Status:** selesai · **Tag:** `desain-d1-rev1`

| Aspek | Detail |
| :--- | :--- |
| Tujuan | Repo rapi, aturan kerja tertulis, dan bahasa visual Bakul terbukti di satu layar |
| Lingkup | `.gitignore`, `AGENTS.md` (lokal), spesifikasi desain, token warna/teks, 9 komponen, Beranda mobile + desktop |
| Keluaran | `bakul.figcraft`, `docs/desain/design.md`, `docs/desain/ekspor/*.png`, `docs/desain/gambar/CREDITS.md` |
| Verifikasi | Screenshot mobile & desktop, ekspor PNG dibaca ulang, cek 16 px/44 px, kontras tombol `#0F6E66` |
| Catatan | Foto asli dari Wikimedia Commons (CC0/CC BY/CC BY-SA); generator gambar gagal karena saldo. Hero memakai tas anyaman. `bakul.figcraft` sengaja tidak di-push. |

**Keputusan desain yang berlaku seterusnya**

- Palet: mint `#AEE3CD`, teal aksi `#0F6E66`, krem `#F1EADA`, abu kartu `#F5F5F5`.
- Judul Poppins Bold, isi Inter; minimum 16 px.
- Tanpa bayangan, gradien, animasi, promo, atau kolom email.
- Setiap kartu produk menampilkan **kota + rating + jumlah terjual** (desktop) atau
  **kota + rating** (mobile).

---

## Sprint 1 — Desain alur pembeli inti (D2)

**Status:** selesai · **Tag:** `desain-d2`

**Tujuan:** pembeli bisa mencari, memilih, memasukkan keranjang, checkout multi-toko,
dan melihat instruksi pembayaran — semuanya dalam desain yang bisa diklik mata.

| Layar | Route | Requirement | Isi wajib | State wajib |
| :--- | :--- | :--- | :--- | :--- |
| Cari + filter | `/search` | CAT-1 | Kolom cari, chip filter (kategori/harga/kota/rating), urutan, grid 2 kolom | Hasil kosong |
| Detail produk | `/p/:slug` | CAT-2 | Galeri, harga, kota + rating, varian, jumlah, kartu toko, perkiraan ongkir, CTA lengket | Stok habis |
| Halaman toko | `/toko/:slug` | CAT-3 | Profil, rating, kota, tab Produk/Ulasan/Info, grid produk | Toko kosong |
| Keranjang | `/cart` | CART-1 | Grup per toko, centang item, jumlah, subtotal per toko, total, CTA Bayar | Keranjang kosong |
| Checkout | `/checkout` | CART-2 | Alamat, kurir per toko, catatan, rincian biaya, total, CTA Bayar sekarang | Kurir tidak tersedia / stok berubah |
| Instruksi bayar | `/pay/:id` | PAY-1 | Hitung mundur, kode pembayaran + salin, 3 langkah, "Saya sudah bayar" | Menunggu / kedaluwarsa |

**Aturan khusus sprint ini**

- Istilah "kode pembayaran", bukan Virtual Account.
- Biaya layanan pembeli = Rp1.000 + 0,7% dari (subtotal + ongkir); komisi 2% tidak
  ditampilkan ke pembeli.
- Keranjang dan checkout **wajib** memperlihatkan pemecahan per toko.
- Versi desktop belum dibuat; fokus mobile 390×844.

**Definisi selesai**

- [ ] Enam layar ada di halaman `01 · Pembeli` pada `bakul.figcraft`.
- [ ] Setiap layar punya state normal + satu state khusus (kosong/error/habis).
- [ ] Semua teks lolos panduan bahasa; tidak ada istilah teknis.
- [ ] Ekspor PNG tersimpan di `docs/desain/ekspor/`.
- [ ] Update papan status, commit, push, tag `desain-d2`.

**Di luar lingkup:** versi desktop, ulasan (hanya tampil), promo, chat penjual.

**Hasil**

- Enam layar normal + enam state khusus selesai di halaman `01 · Pembeli`.
- Ekspor: `b2-cari.png` … `b7-bayar.png` (2×) dan enam berkas state (1×) di
  `docs/desain/ekspor/`.
- State khusus: hasil kosong, stok habis, toko kosong, keranjang kosong, kurir
  tidak tersedia, kode pembayaran kedaluwarsa.
- Rincian biaya checkout memakai angka nyata: subtotal Rp70.000, ongkir Rp17.000,
  biaya layanan Rp1.609, total Rp88.609.
- Catatan: foto produk dipakai ulang lintas layar. Versi desktop belum dibuat.

---

## Sprint 2 — Desain pesanan, onboarding penjual, inbox (D3)

**Status:** selesai · **Tag:** `desain-v1`

| Layar | Route | Requirement | Isi wajib |
| :--- | :--- | :--- | :--- |
| Pesanan saya | `/orders` | ORD-1 | Tab status, kartu pesanan, penjelasan "uang saya di mana?", CTA per status |
| Lacak paket | `/lacak/:awb` | ORD-1 | Timeline kurir, AWB, status terakhir |
| Komplain | `/orders/:id/komplain` | DSP-1, DSP-2 | Alasan, unggah bukti, pilihan solusi, penjelasan dana dibekukan |
| Buka toko 1 | `/jualan` | ONB-1 | Nomor HP |
| Buka toko 2 | `/jualan` | ONB-1 | Kode OTP (tampil di inbox, `123456` saat demo) |
| Buka toko 3 | `/jualan` | ONB-1 | Nama toko |
| Produk pertama | `/jualan` | ONB-2 | Panduan foto 3 langkah + tombol kamera |
| Inbox | `/inbox` | NTF-1 | Daftar chat gaya WhatsApp + isi pesan/OTP |

**Definisi selesai**

- [x] Delapan frame (tiga layar pembeli + onboarding empat frame + inbox) selesai dan konsisten dengan D1.
- [x] Alur onboarding bisa diselesaikan tanpa email.
- [x] Setiap status pesanan menjawab "uang saya di mana?".
- [x] Update dokumen, commit, push, tag `desain-v1`.

**Hasil**

- Berkas: `b8-pesanan.png`, `b9-lacak-paket.png`, `b10-komplain.png`,
  `n1-inbox.png`, `s1-buka-toko-nomor-hp.png`, `s2-buka-toko-otp.png`,
  `s3-buka-toko-nama.png`, `s4-produk-pertama.png`.
- Pesanan memakai tiga status: menunggu bayar, dikirim, selesai — masing-masing
  dengan penjelasan posisi uang.
- Onboarding: nomor HP → OTP (`123456` saat demo) → nama toko → produk pertama.
- Inbox bergaya WhatsApp dengan pesan OTP di urutan teratas.
- Desain tahap pertama selesai. Berikutnya Sprint 3 (fondasi kode).

**Setelah sprint ini desain berhenti.** Dashboard penjual, dompet, dan admin dibuat
menjelang sprint 8–10 agar tidak basi.

---

## Sprint 3 — Fondasi teknis (M0)

**Status:** selesai · **Tag:** `m0-selesai`

**Tujuan:** `npm run dev` menyalakan web + API, database nyambung, dan token desain
masuk ke kode.

| Pekerjaan | Bukti |
| :--- | :--- |
| Install PostgreSQL native, buat `bakul_dev` | `psql -c "select 1"` berhasil |
| Monorepo npm workspaces: `apps/web`, `apps/api`, `packages/shared`, `packages/config` | `npm install` bersih |
| Next.js + NestJS jalan | web :3000, API :3001 |
| Rewrite `/api/*` → API (satu origin) | `GET /api/v1/health` membalas `ok` |
| Prisma 7.10: `users`, `shops`, `products`, `product_variants`, `categories`, `user_addresses` | `npm run db:migrate` |
| Seed deterministik 5 toko / 100 produk | `npm run db:seed` |
| Ekspor variabel FigCraft → Tailwind `@theme` | warna kode = warna desain |
| `.env.example` lengkap | clone baru bisa jalan |

**Versi yang dipin:** Next 16.x, React 19.x, Nest 12.x, Prisma **7.10.x**,
Tailwind 4.x, TypeScript **5.9.x**. Jangan Prisma 8 RC atau TypeScript 7.

**Di luar lingkup:** auth, CI, Docker, deploy.

**Hasil**

- PostgreSQL 17.11 native berjalan di `127.0.0.1:5432`; role `bakul` memiliki
  database `bakul_dev`. Rincian pemasangan ada di `docs/adr/0002-postgresql-lokal.md`.
- Monorepo npm workspaces selesai: `apps/web`, `apps/api`, `packages/shared`,
  `packages/config`.
- Next 16.4.4 + React 19.3.1 di :3000; Nest 12.3.2 di :3001; satu origin lewat
  rewrite `/api/*`. `GET /api/v1/health` membalas `status: "ok"` dari kedua port.
- Prisma 7.10.1 + `@prisma/adapter-pg`, enam tabel M0, migrasi dengan CHECK harga/
  stok dan indeks satu alamat default per pengguna.
- Seed deterministik: 12 pengguna, 5 toko di 5 kota, 8 kategori, 100 produk,
  200 varian, 10 alamat.
- Token FigCraft masuk ke `apps/web/app/globals.css` lewat `@theme`; halaman status
  internal memakai token tersebut dan menampilkan health API.
- `npm run build` dan `npm test` lulus. `npm run dev` menyalakan web + API tanpa
  error; halaman 390 px tidak overflow dan konsol browser bersih.
- Nest CLI tidak dipakai karena versi 12 menuntut TypeScript 6; kompilasi memakai
  `tsc` 5.9.3. Keputusan dicatat di `docs/adr/0001-fondasi-teknis.md`.

**Definisi selesai**

- [x] `psql -c "select 1"` berhasil.
- [x] `npm install` bersih dan Prisma Client dibuat ulang lewat `postinstall`.
- [x] Web :3000 + API :3001 berjalan; `/api/v1/health` lewat satu origin.
- [x] Migrasi enam tabel dan seed 5 toko / 100 produk.
- [x] Token desain masuk ke Tailwind `@theme`.
- [x] `.env.example` lengkap; `.env` tidak di-commit.
- [x] `npm run build` dan `npm test` lulus.
- [x] Papan status diperbarui, commit, push, tag `m0-selesai`.

---

## Sprint 4 — Akun & onboarding (M1)

**Status:** selesai · **Tag:** `m1-selesai`

- Registrasi/login nomor HP + OTP mock (kode tampil di Inbox pada `DEMO_MODE`).
- Refresh token di cookie `httpOnly`; access token di memori.
- Profil + banyak alamat dengan kode wilayah.
- Buka toko 3 langkah, status langsung `ACTIVE` (tanpa KTP).
- Unggah produk pertama + panduan foto.
- Uji: T-13 (onboarding < 5 menit tanpa email), T-12 (akses lintas peran ditolak).

**Hasil**

- Tabel baru: `otp_codes`, `sessions`, `notifications`, `product_images`.
- OTP 6 angka, masa berlaku 10 menit, 3 permintaan/10 menit, 5 percobaan/kode.
  Pada `DEMO_MODE`, kode selalu `123456` dan tampil di UI serta Inbox.
- Sesi: access token 15 menit hanya di memori; refresh token 7 hari di cookie
  `httpOnly`, disimpan sebagai hash, dan dirotasi setiap refresh. Peran dibaca ulang
  dari database pada setiap request terlindungi.
- Halaman: `/masuk`, `/jualan`, `/akun`, `/inbox`.
- Endpoint: auth lengkap, `GET/PATCH /me`, CRUD `/me/addresses`,
  `POST /onboarding/shop`, `POST /onboarding/first-product`, `GET /seller/shop`,
  `GET /admin/ping`, notifikasi, dan penyajian foto lokal.
- Unggah foto produk: JPG/PNG/WebP, maksimal 2 MB, disimpan di `storage/products`
  (gitignored), disajikan lewat `/api/v1/files/products/:filename`.
- Bukti: `docs/bukti/m1-auth.txt` — T-12 dan T-13 lulus; onboarding 0 detik
  (jauh di bawah batas 5 menit) tanpa email.

**Definisi selesai**

- [x] Registrasi/login nomor HP + OTP mock berjalan tanpa email.
- [x] Access token di memori; refresh token `httpOnly` dan rotasi sesi.
- [x] Profil dan banyak alamat dengan kode wilayah.
- [x] Buka toko 3 langkah, status langsung `ACTIVE`.
- [x] Produk pertama + foto tersimpan dan bisa ditampilkan.
- [x] T-13 dan T-12 lulus.
- [x] `npm run build` dan `npm test` lulus.
- [x] Papan status diperbarui, commit, push, tag `m1-selesai`.

---

## Sprint 5 — Katalog & toko (M2)

**Status:** belum · **Estimasi:** ± 1,5 minggu · **Tag:** `m2-selesai`

- CRUD produk, varian, etalase, stok, gambar (storage lokal).
- Pencarian, filter, urutan, halaman toko, ulasan (tampil).
- Halaman katalog pertama < 500 KB; gambar WebP + lazy load.
- Uji: pencarian/filter benar; slug unik; soft delete via status.

---

## Sprint 6 — Keranjang & checkout (M3)

**Status:** belum · **Estimasi:** ± 1,5 minggu · **Tag:** `m3-selesai`

- Keranjang multi-toko, quote ongkir per toko, pembuatan `payments` + N `order_invoices`.
- Kunci stok `SELECT ... FOR UPDATE` + `stock_reserved`.
- Idempotency-Key pada `POST /checkout`.
- Uji: T-01 (1 payment + N invoice), T-02 (100 paralel stok 1 → 1 sukses).

---

## Sprint 7 — Pembayaran, escrow, ledger (M4)

**Status:** belum · **Estimasi:** ± 1,5 minggu · **Tag:** `m4-selesai`

- Mock PG: charge, VA/QRIS, expire, signature HMAC, retry.
- Webhook idempoten + `webhook_events`.
- Escrow `PENDING → HELD → FROZEN/RELEASED/REFUNDED`.
- Ledger double-entry + akun standar PRD Bab 11.3.
- `npm run ledger:check` → 0 selisih.
- Uji: T-03 (webhook 5× = 1 mutasi), T-04 (signature salah 401), T-05 (kedaluwarsa
  mengembalikan stok), T-11 (ledger seimbang setelah 30 pesanan).

---

## Sprint 8 — Pemenuhan & pengiriman (M5)

**Status:** belum · **Estimasi:** ± 1,5 minggu · **Tag:** `m5-selesai`

- Penjual terima/tolak, SLA 48 jam.
- AWB mock deterministik, shipment, label PDF A6 + barcode Code128 + watermark DEMO.
- Timeline tracking + scheduler in-process.
- Uji: T-06 (SLA lewat → batal + refund), T-07 (auto-complete tepat waktu).

---

## Sprint 9 — Dompet & pencairan (M6)

**Status:** belum · **Estimasi:** ± 1 minggu · **Tag:** `m6-selesai`

- Saldo toko dari pelepasan escrow, mutasi, pengajuan tarik saldo.
- Minimum Rp50.000; validasi saldo; approval admin; bukti transfer palsu.
- Jurnal pencairan tetap seimbang.
- Uji: T-10 (tarik melebihi saldo ditolak).

---

## Sprint 10 — Pusat Resolusi & admin (M7)

**Status:** belum · **Estimasi:** ± 1,5 minggu · **Tag:** `m7-selesai`

- Komplain + bukti, ruang diskusi, eskalasi, keputusan admin.
- Refund penuh/sebagian/retur dalam satu jurnal.
- Dashboard admin: GMV, escrow, antrean, moderasi toko/produk.
- Uji: T-08 (komplain membekukan escrow), T-09 (refund sebagian), T-12 (403).

---

## Sprint 11 — Poles, bukti, demo (M8)

**Status:** belum · **Estimasi:** ± 1 minggu · **Tag:** `m8-selesai`

- Seed 30 pesanan historis + data demo deterministik.
- Demo console: time machine, simulator PG, simulator logistik, reset.
- Playwright E2E alur demo 10 menit (Lampiran B PRD).
- `docs/bukti/ledger-check.txt`, `oversell-test.txt`, diagram, ADR.
- GIF 30 detik, `docs/demo.md`, README final.
- Uji: T-14 (teks sesuai panduan bahasa), T-07 (alur demo lulus).

---

## Lampiran A — Ritme commit, push, dan tag

Setiap checkpoint:

```bash
git add -A
git commit -m "<tipe>(<area>): <ringkasan>"
git push
```

- Satu sprint = beberapa commit kecil, minimal satu per checkpoint.
- Akhir sprint: `git tag <nama> && git push --tags`.
- Jangan pernah commit `.env`, `node_modules`, `storage/`.
- `AGENTS.md` dan `bakul.figcraft` **tidak** di-push (lihat `.gitignore`).
  Cadangkan `bakul.figcraft` di komputer; repo hanya menyimpan PNG ekspornya.

---

## Lampiran B — Definisi selesai (berlaku semua sprint)

1. Acceptance criteria sprint terpenuhi.
2. Logika domain punya unit test (setelah Sprint 3).
3. `npm run test` lulus.
4. Berjalan di `npm run dev` tanpa error konsol.
5. Teks lolos panduan bahasa PRD Bab 8.3.
6. Dokumentasi/Swagger diperbarui bila menyentuh API.
7. Tidak ada `TODO` menggantung tanpa tiket.
8. Papan status di dokumen ini diperbarui, lalu commit + push.

---

## Lampiran C — Peta file

| Lokasi | Isi |
| :--- | :--- |
| `docs/prd/bakul-v0.2.md` | PRD final |
| `docs/desain/design.md` | token, komponen, daftar layar |
| `docs/desain/ekspor/` | PNG tinjauan tiap layar |
| `docs/desain/gambar/` | foto aset + `CREDITS.md` |
| `docs/bukti/` | output uji (ledger, oversell) |
| `docs/adr/` | catatan keputusan arsitektur |
| `apps/web` | Next.js (pembeli, penjual, admin, demo) |
| `apps/api` | NestJS modular |
| `packages/shared` | tipe, skema Zod, format Rupiah |
| `scripts/` | seed, ledger check, demo |
| `AGENTS.md` | aturan kerja agent (lokal) |
| `bakul.figcraft` | berkas desain sumber (lokal) |

---

## Lampiran D — Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Scope creep | Sprint tidak selesai | Non-goals PRD Bab 5.3 mengikat; sprint ini jadi pagar |
| Desain basi sebelum diimplementasikan | Pekerjaan ulang | Desain berhenti setelah Sprint 2; dashboard menyusul dekat implementasinya |
| Ledger tidak seimbang | Data uang rusak | Double-entry + `ledger:check` + T-11 |
| Overselling | Stok terjual ganda | `SELECT FOR UPDATE` + T-02 |
| Webhook ganda | Saldo dobel | `event_id` unik + T-03 |
| Waktu simulasi kacau | SLA tidak teruji | `ClockService`; larangan `new Date()` di domain |
| File desain besar | Repo membengkak | `.figcraft` tidak di-push; hanya PNG ekspor |
| Motivasi turun | Proyek berhenti | Demo tiap akhir sprint; sprint kecil |

---

## Catatan perubahan dokumen

| Tanggal | Perubahan |
| :--- | :--- |
| 3 Nov 2026 | Dokumen dibuat; Sprint 0 selesai, Sprint 1 disiapkan |
| 3 Nov 2026 | Sprint 1 selesai (12 layar termasuk state); tag `desain-d2` |
| 3 Nov 2026 | Sprint 2 selesai (8 frame); desain tahap pertama selesai; tag `desain-v1` |
| 3 Nov 2026 | Sprint 3 selesai: PostgreSQL 17.11, monorepo, health API, Prisma + seed, token Tailwind; tag `m0-selesai` |
| 3 Nov 2026 | Perbaikan pasca-M0: hidrasi dev di `127.0.0.1`, timeout health check, ikon aplikasi |
| 3 Nov 2026 | Sprint 4 selesai: OTP, sesi aman, profil/alamat, buka toko, produk pertama + foto; tag `m1-selesai` |
