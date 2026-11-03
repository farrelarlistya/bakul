# Rencana Sprint — Bakul

| Atribut | Detail |
| :--- | :--- |
| Versi dokumen | 1.0 |
| Tanggal | 3 November 2026 |
| Status | Sprint 0–11 selesai · M8 selesai |
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
| 5 | Katalog & toko / M2 | **Selesai** | `m2-selesai` |
| 6 | Keranjang & checkout / M3 | **Selesai** | `m3-selesai` |
| 7 | Pembayaran, escrow, ledger / M4 | **Selesai** | `m4-selesai` |
| 8 | Pemenuhan & pengiriman / M5 | **Selesai** | `m5-selesai` |
| 9 | Dompet & pencairan / M6 | **Selesai** | `m6-selesai` |
| 10 | Pusat Resolusi & admin / M7 | **Selesai** | `m7-selesai` |
| 11 | Poles, bukti, demo / M8 | **Selesai** | `m8-selesai` |
| 12 | Poles UI/UX & Interaction Design / M9 | **Selesai** | `m9-selesai` |

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

**Status:** selesai · **Tag:** `m2-selesai`

- CRUD produk, varian, etalase, stok, gambar (storage lokal).
- Pencarian, filter, urutan, halaman toko, ulasan (tampil).
- Halaman katalog pertama < 500 KB; gambar WebP + lazy load.
- Uji: pencarian/filter benar; slug unik; soft delete via status.

**Hasil**

- Tabel baru: `shop_etalases`, `reviews`; `products.etalase_id`.
- Seed: 100 produk, 10 etalase, 100 foto, 200 ulasan; foto produk WebP
  (nastar/keripik/kopi/batik/anyaman) sesuai kategori.
- Beranda katalog, `/cari` dengan filter kategori/kota/harga/rating dan urutan,
  detail `/p/:slug`, halaman toko `/toko/:slug` dengan kelompok etalase.
- Penjual `/jualan/barang`: tambah/ubah barang, tambah/ubah/hapus pilihan,
  stok, foto (maksimal 5), etalase, aktif/nonaktif, dan soft delete.
- Foto unggahan dikonversi WebP target 32 KB; seed foto juga ≤32 KB.
- Berat Beranda produksi **488 KB** pada 390 px (di bawah 500 KB).
- Bukti `docs/bukti/m2-katalog.txt`: pencarian/filter, slug unik, foto WebP,
  variasi/stok, soft delete, etalase, dan berat halaman lulus.

**Definisi selesai**

- [x] CRUD produk, varian, etalase, stok, dan gambar.
- [x] Pencarian/filter/urutan dan halaman toko.
- [x] Ulasan tampil di detail barang.
- [x] Berat halaman pertama < 500 KB; gambar WebP + lazy load.
- [x] Slug unik dan soft delete via status.
- [x] `npm run build` dan `npm test` lulus.
- [x] Papan status diperbarui, commit, push, tag `m2-selesai`.

---

## Sprint 6 — Keranjang & checkout (M3)

**Status:** selesai · **Tag:** `m3-selesai`

- Keranjang database per pengguna, dikelompokkan per toko, item bisa dipilih.
- Quote ongkir per toko memakai zona kota/provinsi/pulau, berat, kurir, dan layanan.
- Checkout mengunci varian dengan `SELECT ... FOR UPDATE`, menurunkan stok tersedia,
  menaikkan stok ditahan, lalu membuat 1 `payments` + N `order_invoices`.
- `Idempotency-Key` wajib; kunci yang sama mengembalikan tagihan yang sama.
- Snapshot nama, pilihan, harga, berat, dan foto disimpan di `order_items`.
- Halaman `/keranjang`, `/bayar`, dan `/pembayaran/:id` sudah terhubung ke API.

**Hasil uji**

- `docs/bukti/m3-keranjang-checkout.txt`
- T-01: 1 pembayaran untuk 2 pesanan toko; kirim ulang kunci tidak menggandakan.
- T-02: 100 checkout paralel pada stok 1 → 1 sukses, 99 gagal bersih.
- Tagihan kedaluwarsa mengembalikan stok.

**Definisi selesai**

- [x] Keranjang multi-toko dan pilihan item.
- [x] Quote ongkir per toko dan total gabungan.
- [x] 1 payment + N invoice dengan snapshot.
- [x] Kunci stok dan idempotensi checkout.
- [x] T-01 dan T-02 lulus.
- [x] Build, test, dokumentasi, commit, push, tag.

---

## Sprint 7 — Pembayaran, escrow, ledger (M4)

**Status:** selesai · **Tag:** `m4-selesai`

- `MockPgService` membuat kode VA/QRIS, kedaluwarsa, dan tanda tangan HMAC.
- Webhook mentah diverifikasi, `webhook_events` unik, dan duplikat diabaikan.
- Escrow `PENDING → HELD → FROZEN/RELEASED/REFUNDED/PARTIALLY_REFUNDED`.
- Ledger double-entry dengan akun `CASH`, `ESCROW_LIABILITY`,
  `SELLER_PAYABLE:{shop}`, `PLATFORM_REVENUE`, `PG_FEE_EXPENSE`.
- Trigger database menolak update/delete `ledger_entries`.
- `npm run ledger:check` dan scheduler kedaluwarsa.

**Hasil uji**

- `docs/bukti/m4-pembayaran-escrow.txt`
- T-03: webhook 5× = 1 baris event, 1 jurnal bayar, 1 biaya PG.
- T-04: signature salah → 401 tanpa mutasi.
- T-05: QRIS kedaluwarsa, stok kembali, pesanan batal.
- T-11: 40+ pesanan, seluruh jurnal seimbang, escrow cocok, 0 selisih dompet.

**Definisi selesai**

- [x] Mock PG, VA/QRIS, HMAC, webhook idempoten.
- [x] Escrow dan ledger double-entry.
- [x] `ledger:check` → 0 selisih.
- [x] T-03, T-04, T-05, T-11 lulus.
- [x] Build, test, dokumentasi, commit, push, tag.

---

## Sprint 8 — Pemenuhan & pengiriman (M5)

**Status:** selesai · **Tag:** `m5-selesai`

- Penjual menerima/menolak, SLA 48 jam, dan pembatalan otomatis + refund.
- AWB deterministik, shipment, timeline 6 kejadian, dan scheduler in-process.
- Label PDF A6 dengan barcode Code128, QR, dan watermark DEMO.
- Halaman pesanan masuk, detail penjual, pelacakan publik, dan unduh label.

**Hasil uji**

- `docs/bukti/m5-pemenuhan.txt`
- T-06: penjual lewat SLA → batal, stok kembali, refund dijurnal.
- SHP-4: resi dan label PDF dibuat.
- T-07: auto-complete 72 jam, escrow dilepas, saldo bertambah.

**Definisi selesai**

- [x] Terima/tolak dan SLA.
- [x] AWB, label PDF, dan tracking.
- [x] T-06 dan T-07 lulus.
- [x] Build, test, dokumentasi, commit, push, tag.

---

## Sprint 9 — Dompet & pencairan (M6)

**Status:** selesai · **Tag:** `m6-selesai`

- Saldo toko dari pelepasan escrow dan mutasi ledger.
- Pengajuan tarik saldo dengan minimum Rp50.000, validasi saldo, dan
  `Idempotency-Key`.
- Admin menyetujui/menolak; persetujuan membuat jurnal dan bukti transfer
  simulasi. Saldo tertahan dipakai selama pengajuan belum diputuskan.

**Hasil uji**

- `docs/bukti/m6-dompet.txt`
- T-10: tarik melebihi saldo dan di bawah minimum ditolak.
- Pengajuan ganda tidak menggandakan saldo.
- Jurnal pencairan seimbang dan bukti transfer tersedia.

**Definisi selesai**

- [x] Saldo, mutasi, dan pengajuan tarik saldo.
- [x] Minimum, validasi saldo, approval admin.
- [x] Jurnal pencairan seimbang.
- [x] T-10 lulus.
- [x] Build, test, dokumentasi, commit, push, tag.

---

## Sprint 10 — Pusat Resolusi & admin (M7)

**Status:** selesai · **Tag:** `m7-selesai`

- Komplain dengan bukti foto/video, ruang diskusi, eskalasi, refund penuh,
  refund sebagian, dan retur.
- Keputusan admin dalam satu jurnal seimbang.
- Dashboard admin: GMV, dana ditahan, pesanan per status, antrean komplain,
  antrean pencairan, moderasi toko, dan moderasi barang.
- Otorisasi per peran di server.

**Hasil uji**

- `docs/bukti/m7-resolusi.txt`
- T-08: komplain membekukan escrow dan membuka diskusi.
- T-09: refund sebagian Rp20.000 tercatat dalam satu jurnal Rp45.912.
- T-12: akses lintas peran ditolak 403/404.

**Definisi selesai**

- [x] Komplain, bukti, diskusi, eskalasi.
- [x] Refund penuh/sebagian/retur.
- [x] Dashboard admin dan moderasi.
- [x] T-08, T-09, T-12 lulus.
- [x] Build, test, dokumentasi, commit, push, tag.

---

## Sprint 11 — Poles, bukti, demo (M8)

**Status:** selesai · **Tag:** `m8-selesai`

- Seed 30 pesanan historis dengan status beragam, dompet, dan satu antrean
  pencairan; tetap deterministik dan aman dijalankan ulang.
- Demo Console `/dev`: time machine, kecepatan waktu, simulator pembayaran,
  pemeriksaan SLA, dan reset transaksi.
- Playwright E2E memakai Chrome terpasang, viewport 390×844:
  pembeli (cari → keranjang → bayar), penjual, dan admin.
- `docs/bukti/ledger-check.txt`, `m3`–`m8`, `oversell-test.txt`.
- `docs/arsitektur.md`, `docs/model-data.md`, `docs/state-machine.md`,
  `docs/demo.md`, ADR 0006, README final, dan galeri tangkapan layar.

**Hasil uji**

- `docs/bukti/m8-demo.txt`
- T-14: 8 halaman utama bebas 16 istilah teknis terlarang.
- `npm run test:e2e`: 3 skenario lulus.
- `npm run ledger:check`: 0 selisih.
- Seed: 12 pengguna, 5 toko, 100 produk, 30+ pesanan historis.

**Definisi selesai**

- [x] Seed pesanan historis dan data demo deterministik.
- [x] Demo console lengkap.
- [x] E2E Playwright alur demo.
- [x] Ledger check, oversell test, diagram, ADR, demo.md, README.
- [x] Galeri tangkapan layar dan GIF ringkas.
- [x] T-14 lulus.
- [x] Build, test, dokumentasi, commit, push, tag.

---

## Sprint 12 — Poles UI/UX & Interaction Design (M9)

**Status:** selesai · **Tag:** `m9-selesai`

Audit Baseline terhadap 25 rute web menemukan 20 kelemahan: tidak ada sistem
loading/skeleton, tidak ada toast, error selalu di atas halaman, 9 empty state
tanpa jalan keluar, 11 `window.confirm`/`window.prompt`, mikro-interaksi nyaris
tidak ada, hierarki tipografi dan spasi yang tidak seragam, lebar konten desktop
1024 px (spesifikasi 1200 px), dan enam nilai warna lepas di luar token.

**Keputusan yang dipakai**

| Topik | Keputusan |
| :--- | :--- |
| Palet, tema, font | **Tidak diubah** — hanya token turunan dari hue yang sudah ada |
| Gerak | Motion minimal: ≤180 ms, warna/opacity/transform, tanpa shadow/gradien, mati saat `prefers-reduced-motion` |
| Cakupan | Seluruh halaman: pembeli, penjual, admin, demo console |
| Dialog | In-app dan aksesibel (focus trap, Escape, fokus kembali ke pemicu) |
| Logika bisnis | Nol perubahan — `apps/api` dan `packages/shared` tidak disentuh |

**Pekerjaan**

- 4 token turunan (`bahaya-muda`, `garis-kuat`, `garis-lembut`, `krem-terang`) dan
  3 token gerak (`duration-*`, `ease-standar`, `animate-*`).
- 14 komponen interaksi baru: skeleton, toast, empty state, modal, konfirmasi,
  input dialog, field, banner status, stepper jumlah, bintang rating, salin,
  kepala halaman, kartu metrik, dan provider badge bersama.
- 28 ikon baru dan sekitar 30 kelas baru di `components/ui.ts`.
- 20 halaman diperbarui: loading skeleton, validasi inline di field, empty state
  informatif, tombol lengket di mobile, kartu radio untuk pilihan, dan dialog
  konfirmasi menggantikan dialog browser.
- `app/status-panel.tsx` dihapus karena tidak diimpor di mana pun.

**Hasil uji**

- `npm run build --workspace @bakul/web` lulus tanpa galat.
- `npm run test` lulus (24 uji di `packages/shared`).
- `npm run test:e2e` lulus (4 skenario Playwright).
- Tidak ada `window.confirm`/`window.prompt`, tidak ada teks di bawah 16 px,
  tidak ada nilai warna lepas di luar token.

**Definisi selesai**

- [x] Token turunan dan geraknya masuk ke `@theme` Tailwind.
- [x] Pustaka komponen interaksi dibuat dan dipakai di seluruh halaman.
- [x] Semua `window.confirm`/`window.prompt` diganti dialog in-app.
- [x] Validasi error pindah dari atas halaman ke dekat field.
- [x] Semua empty state punya ikon, penjelasan, dan jalan keluar.
- [x] Palet, tema, dan font tidak berubah.
- [x] `npm run build`, `npm run test`, `npm run test:e2e` lulus.
- [x] Papan status diperbarui, commit, push, tag.

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
| 3 Nov 2026 | Sprint 5 selesai: katalog, pencarian/filter, detail, toko, etalase, ulasan, kelola barang, foto WebP; tag `m2-selesai` |
| 3 Nov 2026 | Sprint 6 selesai: keranjang multi-toko, quote ongkir, checkout 1 payment + N invoice, kunci stok, idempotensi; tag `m3-selesai` |
| 3 Nov 2026 | Sprint 7 selesai: mock PG, webhook HMAC idempoten, escrow, ledger append-only, `ledger:check`; tag `m4-selesai` |
| 3 Nov 2026 | Sprint 8 selesai: SLA penjual, AWB, label PDF, tracking, auto-complete; tag `m5-selesai` |
| 3 Nov 2026 | Sprint 9 selesai: dompet toko, tarik saldo, approval, bukti transfer; tag `m6-selesai` |
| 3 Nov 2026 | Sprint 10 selesai: komplain, mediasi, refund sebagian, dashboard admin, moderasi; tag `m7-selesai` |
| 3 Nov 2026 | Sprint 11 selesai: seed 30 pesanan, demo console, Playwright E2E, docs arsitektur/state machine, bukti; tag `m8-selesai` |
| 3 Nov 2026 | Sprint 12 selesai: audit 20 kelemahan UI/UX, token turunan, 14 komponen interaksi baru, dialog in-app menggantikan `window.confirm`/`window.prompt`, validasi inline, empty state, tombol lengket; tag `m9-selesai` |
