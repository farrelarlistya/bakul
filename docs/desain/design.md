# Spesifikasi Desain — Bakul

| Atribut | Nilai |
| :--- | :--- |
| Versi | 0.1 |
| Status | Desain selesai (D1–D3) — menunggu review |
| Sumber produk | `docs/prd/bakul-v0.2.md` |
| Sumber gaya | `docs/desain/referensi/referensiStyleDesign.jpg` |
| Berkas desain | `bakul.figcraft` |
| Rencana sprint | `docs/rencana-sprint.md` |
| Ekspor tinjauan | `docs/desain/ekspor/` |

---

## 1. Arah gaya

Referensi adalah etalase grocery: putih bersih, blok hero mint, kartu kategori krem,
kartu produk abu muda, tombol teal, judul tebal, dan foto produk yang dipotong bersih.
Gaya itu dipakai untuk Bakul dengan tiga penyesuaian:

1. **Bukan promo, tapi kepercayaan.** Tidak ada diskon, harga coret, hitung mundur
   promo, atau kolom email. Tempatnya diisi janji utama Bakul: uang ditahan aman.
2. **Bukan groceries.** Kategori dan foto mewakili dagangan pedagang kecil secara umum
   (sembako, kue kering, fashion, kerajinan), bukan sayur dan buah.
3. **Mobile dulu.** Referensi desktop 1440 dijadikan acuan gaya; layar utama Bakul
   adalah 390×844 dengan batas uji 360 px.

Sifat visual: datar, lapang, ramah, tanpa bayangan dan gradien. Warna hangat (krem)
menyeimbangkan mint/teal agar tidak terasa seperti toko sayur.

---

## 2. Token warna

| Token | Hex | Pemakaian |
| :--- | :--- | :--- |
| `mint` | `#AEE3CD` | Blok hero, latar badge lembut |
| `mint-muda` | `#D7F2E6` | State terpilih, latar chip |
| `teal` | `#198B81` | Ikon, tautan, garis aktif |
| `teal-aksi` | `#0F6E66` | Latar tombol utama (kontras 6,4:1 dengan putih) |
| `teal-tua` | `#0B5A54` | Teks di atas latar mint (kontras 5,6:1) |
| `krem` | `#F1EADA` | Kartu kategori, blok ajakan buka toko |
| `abu-kartu` | `#F5F5F5` | Kartu produk, kolom pencarian |
| `putih` | `#FFFFFF` | Halaman, header, kartu |
| `tinta` | `#14201B` | Teks utama |
| `tinta-lembut` | `#5C6B64` | Teks sekunder (kontras 5,7:1 di putih) |
| `garis` | `#E6E6E6` | Pembatas, border |
| `perhatian` | `#B45309` | Stok hampir habis, ikon peringatan |
| `perhatian-tua` | `#94420A` | Teks peringatan di atas krem (kontras 5,8:1) |
| `bahaya` | `#B42318` | Error, komplain |

Catatan kontras: `#198B81` dengan teks putih hanya ±4,1:1, sehingga **tidak dipakai
sebagai latar teks**. Latar tombol selalu `#0F6E66`. Teks di atas `mint` memakai
`teal-tua`, bukan `teal-aksi`; teks peringatan di atas `krem` memakai
`perhatian-tua`, bukan `perhatian`.

---

## 3. Tipografi

| Gaya | Font | Ukuran / tinggi baris | Pemakaian |
| :--- | :--- | :--- | :--- |
| Display | Poppins Bold | 32 / 40 | Judul hero desktop |
| H1 | Poppins Bold | 28 / 36 | Judul halaman |
| H2 | Poppins Bold | 24 / 32 | Judul bagian |
| H3 | Poppins Bold | 20 / 28 | Judul kartu/blok |
| Body | Inter Regular | 18 / 28 | Isi utama |
| Body kecil | Inter Regular | 16 / 24 | Meta, keterangan (minimum) |
| Label | Inter SemiBold | 16 / 20 | Tombol, label tab |
| Harga | Inter Bold | 18 / 24 | Harga produk |

Tidak ada teks di bawah 16 px. Poppins dipakai hanya untuk judul agar beban font kecil;
bila anggaran halaman terlampaui, judul turun ke system font tanpa mengubah tata letak.

---

## 4. Spasi, radius, dan ukuran sentuh

- Skala spasi: 4, 8, 12, 16, 24, 32, 48.
- Radius: 8 (tombol, input), 12 (kartu produk), 16 (kartu kategori, hero, sheet), 999 (pil).
- Target sentuh minimum 44×44 px.
- Margin layar mobile: 16 px. Jarak antar kartu: 12 px.
- Lebar konten desktop: 1200 px (margin 120 px pada kanvas 1440).
- Pada 360 px: grid produk menjadi 158 px per kartu. Nama produk boleh dua baris
  dan tinggi kartu mengikuti isi (hug); tombol tetap menempel di bawah.

---

## 5. Komponen

Komponen master yang sudah dibuat di halaman `00 · Fondasi` (9 buah):

1. `Atom/Tombol Utama` — teal-aksi, 180×48
2. `Atom/Tombol Sekunder` — garis, latar putih, 180×48
3. `Atom/Tombol Nonaktif` — abu, teks lembut, 180×48
4. `Atom/Input` — abu muda, radius 8, 320×52
5. `Atom/Kartu Produk` — 173×232, termasuk ilustrasi, harga, tombol 44 px
6. `Atom/Kartu Kategori` — krem, 104×104
7. `Atom/Badge Menunggu bayar` — 148×36 (varian lain masih frame)
8. `Atom/Nav Bawah` — 390×80, 5 tab: Beranda, Cari, Keranjang, Pesanan, Akun
9. `Atom/Baris Kepercayaan` — 340×52

Input OTP dibuat sebagai enam frame (bukan komponen) karena tiap kotak perlu state
terpisah saat implementasi. Header atas dan bubble chat menyusul di D2–D3.

---

## 6. Daftar layar

| ID | Layar | Route | Requirement | Sesi | Status |
| :-- | :--- | :--- | :--- | :-- | :--- |
| F | Fondasi: token, tipe, atom | — | UX-1 | D1 | Selesai |
| B1 | Beranda (mobile + desktop) | `/` | CAT-1 | D1 | Selesai |
| B2 | Cari + filter | `/search` | CAT-1 | D2 | Selesai (normal + kosong) |
| B3 | Detail produk | `/p/:slug` | CAT-2 | D2 | Selesai (normal + stok habis) |
| B4 | Halaman toko | `/toko/:slug` | CAT-3 | D2 | Selesai (normal + kosong) |
| B5 | Keranjang multi-toko | `/cart` | CART-1 | D2 | Selesai (normal + kosong) |
| B6 | Checkout | `/checkout` | CART-2 | D2 | Selesai (normal + error kurir) |
| B7 | Instruksi pembayaran | `/pay/:id` | PAY-1 | D2 | Selesai (normal + kedaluwarsa) |
| B8 | Pesanan saya | `/orders` | ORD-1 | D3 | Selesai |
| B9 | Lacak paket | `/lacak/:awb` | ORD-1 | D3 | Selesai |
| B10 | Komplain | `/orders/:id/komplain` | DSP-1 | D3 | Selesai |
| S1–S4 | Buka toko 3 langkah | `/jualan` | ONB-1, ONB-2 | D3 | Selesai (4 frame) |
| N1 | Inbox gaya WhatsApp | `/inbox` | NTF-1 | D3 | Selesai |

Dashboard penjual, dompet, dan admin belum dibuat; dijadwalkan sebelum Sprint 8–10.

---

## 7. Isi Beranda

Urutan dari atas ke bawah (mobile):

1. Header: merek `bakul`, ikon cari, ikon chat/Inbox dengan badge, ikon keranjang
   dengan badge, dan menu akun.
2. Baris kepercayaan gelap: "Uang ditahan aman sampai barang diterima".
3. Sapaan pembeli, kolom cari besar, dan tombol filter.
4. Hero mint: judul "Belanja dari tetangga, sampai ke rumah", subjudul, tombol
   "Jelajahi kategori", foto tas anyaman.
5. Dua kartu kepercayaan: "Uang aman" dan "Komplain".
6. Kategori: 8 kartu ikon, gulir horizontal di layar sempit.
7. Lagi laris: grid 2 kolom, foto asli, harga tanpa coretan, kota + rating,
   nama toko.
8. Ajakan "Punya dagangan? Buka toko gratis".
9. Navigasi bawah: Beranda, Cari, Keranjang, Pesanan, Akun.

Desktop menambahkan: menu atas, kolom pencarian, empat kategori sejajar, empat produk
sejajar (kota, rating, jumlah terjual), blok ajakan "Punya dagangan? Buka toko gratis",
dan footer hitam berisi tautan, metode pembayaran simulasi, serta keterangan
"tidak ada uang nyata yang berpindah".

---

## 8. Aturan yang diuji saat review

- [ ] Semua teks ≥ 16 px; tombol ≥ 44 px.
- [ ] Kontras teks ≥ 4,5:1 (terutama teks putih di atas teal).
- [ ] Tidak ada istilah teknis (escrow, invoice, VA, checkout, webhook).
- [ ] Tidak ada elemen promo atau kolom email.
- [ ] Setiap harga memakai format `Rp` dengan titik ribuan.
- [ ] Tidak ada bayangan, gradien, atau animasi.
- [ ] Tidak ada gambar abu-abu `#D9D9D9` yang menutupi area gambar.
- [ ] Panah/ikon tidak gepeng (rasio asli).
- [ ] Badge tidak pecah dua baris.

---

## 9. Catatan aset

Foto yang dipakai adalah **foto asli dari Wikimedia Commons**, bukan ilustrasi.
Tujuannya agar mockup terasa seperti etalase sungguhan: penjual memang memakai foto
dengan latar dan kualitas yang berbeda-beda.

Sejak M9 katalog demo memakai **32 foto**, satu untuk setiap produk. Semuanya
berkas `katalog-*.jpg` di `docs/desain/gambar/`. Foto lama tetap disimpan untuk
Beranda dan arsip desain:

| Kebutuhan | Berkas | Lisensi |
| :--- | :--- | :--- |
| Hero Beranda | `hero-tas-anyaman.jpg` | CC0 |
| Arsip: nastar | `produk-nastar.jpg` | CC0 |
| Arsip: keripik | `produk-keripik.jpg` | CC BY-SA 4.0 |
| Arsip: kopi | `produk-kopi.jpg` | CC BY 4.0 |
| Arsip: batik | `produk-batik.jpg` | CC BY-SA 3.0 nl |

Atribusi lengkap 37 berkas ada di `docs/desain/gambar/CREDITS.md`. Foto katalog
dikumpulkan lewat `scripts/fetch-product-photos.mjs`, yang menolak lisensi di luar
CC0, Public domain, CC BY, dan CC BY-SA. Foto diperkecil dan dipotong di dalam
frame; seed mengubahnya menjadi WebP target ≤ 32 KB. Pada produksi, foto diganti
dengan unggahan penjual.

---

## 10. Hasil D1

**Halaman di `bakul.figcraft`**

| Halaman | Isi |
| :--- | :--- |
| `00 · Fondasi` | 12 swatch warna, 8 text style, 9 komponen atom |
| `01 · Pembeli` | `B1 · Beranda · Mobile` (390×844), `B1 · Beranda · Desktop` (1440×1320) |
| `02 · Penjual` | Kosong — diisi pada D3 |

**Ekspor tinjauan**

| Berkas | Ukuran |
| :--- | :--- |
| `docs/desain/ekspor/f-fondasi.png` | 1133×1640 |
| `docs/desain/ekspor/b1-beranda-mobile.png` | 780×1688 (2×) |
| `docs/desain/ekspor/b1-beranda-desktop.png` | 1440×1508 |

**Yang perlu diputuskan saat review**

1. Foto asli: apakah campuran latar (piring, mangkuk, kain) sudah terasa wajar?
2. Footer: kolom dan metode pembayaran sudah sesuai, atau perlu alamat/kontak?
3. Nada judul "Dukung UMKM lokal, sampai ke rumahmu" — sudah tepat?
4. Kartu produk: kota + rating + jumlah terjual sudah cukup informatif?

**Keterbatasan D1 yang disadari**

- Belum ada varian 360 px; aturan penyesuaiannya sudah dicatat di bagian 4.
- State memuat (loading) belum dibuat; state kosong/error sudah ada untuk D2.
- Warna belum di-bind ke variabel `Core` di setiap lapisan. Variabel sudah ada dan
  siap diekspor ke Tailwind; binding menyeluruh dilakukan saat implementasi agar
  tidak ada nilai lepas.
- Foto berasal dari Wikimedia Commons (lihat `CREDITS.md`) dan harus diganti dengan
  foto penjual saat produksi.
- Berkas `bakul.figcraft` berukuran ± 7,7 MB karena menyimpan riwayat gambar.
  Jika tumbuh melebihi 50 MB, pindahkan ke Git LFS.

---

## 11. Hasil D2

Enam layar alur pembeli, masing-masing dengan satu state khusus. Semua berada di
halaman `01 · Pembeli` pada `bakul.figcraft`.

| Layar | Normal | State khusus |
| :--- | :--- | :--- |
| B2 Cari | `b2-cari.png` | Hasil kosong: `b2-cari-kosong.png` |
| B3 Detail produk | `b3-detail.png` | Stok habis: `b3-detail-stok-habis.png` |
| B4 Halaman toko | `b4-toko.png` | Toko kosong: `b4-toko-kosong.png` |
| B5 Keranjang | `b5-keranjang.png` | Keranjang kosong: `b5-keranjang-kosong.png` |
| B6 Checkout | `b6-checkout.png` | Kurir tidak tersedia: `b6-checkout-error-kurir.png` |
| B7 Instruksi bayar | `b7-bayar.png` | Kedaluwarsa: `b7-bayar-kedaluwarsa.png` |

Ekspor normal 2×, state khusus 1×. Semua di `docs/desain/ekspor/`.

**Keputusan yang diambil di D2**

- Foto produk yang sama dipakai ulang di beberapa layar; latar berbeda dibiarkan
  karena menyerupai etalase UMKM sungguhan.
- Kartu produk selalu menampilkan kota + rating (mobile) atau kota + rating +
  jumlah terjual (desktop).
- Checkout memakai contoh nyata: subtotal Rp70.000, ongkir Rp17.000, biaya layanan
  Rp1.609 (Rp1.000 + 0,7%), total Rp88.609.
- Checkout error: ongkir hanya toko pertama (Rp9.000), biaya layanan Rp1.553,
  total sementara Rp80.553, tombol dinonaktifkan.
- Instruksi bayar memakai "kode pembayaran" dan contoh VA BCA 14 digit, bukan
  istilah Virtual Account.
- Tidak ada promo, harga coret, atau kolom email di seluruh layar.

**Yang perlu diputuskan saat review D2**

1. Alur Cari → Detail → Keranjang → Checkout → Bayar sudah masuk akal?
2. State kosong/error cukup jelas, atau perlu ilustrasi yang lebih besar?
3. Checkout: pilihan kurir per toko sudah terbaca, atau terlalu padat?
4. Instruksi bayar: 3 langkah sudah cukup, atau perlu tombol bantuan?
5. Halaman toko: tab Produk/Ulasan/Info sudah pas?

---

## 12. Hasil D3

Delapan frame terakhir, tersebar di dua halaman:

| Layar | Berkas | Halaman |
| :--- | :--- | :--- |
| B8 Pesanan | `b8-pesanan.png` | `01 · Pembeli` |
| B9 Lacak paket | `b9-lacak-paket.png` | `01 · Pembeli` |
| B10 Komplain | `b10-komplain.png` | `01 · Pembeli` |
| N1 Inbox | `n1-inbox.png` | `01 · Pembeli` |
| S1 Nomor HP | `s1-buka-toko-nomor-hp.png` | `02 · Penjual` |
| S2 OTP | `s2-buka-toko-otp.png` | `02 · Penjual` |
| S3 Nama toko | `s3-buka-toko-nama.png` | `02 · Penjual` |
| S4 Produk pertama | `s4-produk-pertama.png` | `02 · Penjual` |

**Keputusan yang diambil**

- Kartu pesanan selalu menjawab "uang saya di mana?": menunggu bayar, ditahan aman,
  atau sudah diteruskan ke penjual.
- Lacak paket memakai timeline lima langkah dengan status aktif yang jelas.
- Komplain menampilkan "Dana ditahan sampai komplain selesai" dan pilihan solusi.
- Onboarding hanya butuh nomor HP, OTP, nama toko, dan produk pertama. Tidak ada
  email, KTP, atau kata "verifikasi identitas".
- Inbox bergaya WhatsApp; pesan OTP menampilkan kode `123456` (mode demo).
- Semua ekspor 2×.

**Yang perlu diputuskan saat review D3**

1. Kartu pesanan: tiga status yang ditampilkan sudah mewakili kebutuhan?
2. Lacak paket: timeline sudah cukup, atau perlu peta/proof of delivery?
3. Komplain: pilihan alasan dan solusi sudah masuk akal untuk Ibu Sri?
4. Onboarding: empat langkah terasa cepat, atau ada yang bisa digabung?
5. Inbox: apakah pesan OTP di daftar sudah cukup jelas?

---

## 13. Status desain

Desain tahap pertama **selesai**: 9 layar inti + 6 state khusus + 4 frame onboarding.
Sprint 3 (fondasi kode) juga sudah selesai; token di bawah sudah dipakai Tailwind.
Dashboard penjual, dompet, dan admin didesain menjelang Sprint 8–10.

Berkas sumber `bakul.figcraft` hanya ada di komputer pemilik (tidak di-push).
Repositori menyimpan PNG ekspor sebagai bukti dan acuan implementasi.

---

## 14. Token di kode

Token dari bagian 2 sudah masuk ke `apps/web/app/globals.css` lewat blok `@theme`
Tailwind 4. Nama kelas mengikuti token, misalnya `bg-teal-aksi`, `text-tinta-lembut`,
dan `rounded-kartu`.

| Token FigCraft | Variabel Tailwind | Nilai |
| :--- | :--- | :--- |
| `mint` | `--color-mint` | `#AEE3CD` |
| `mint-muda` | `--color-mint-muda` | `#D7F2E6` |
| `teal` | `--color-teal` | `#198B81` |
| `teal-aksi` | `--color-teal-aksi` | `#0F6E66` |
| `teal-tua` | `--color-teal-tua` | `#0B5A54` |
| `krem` | `--color-krem` | `#F1EADA` |
| `abu-kartu` | `--color-abu-kartu` | `#F5F5F5` |
| `putih` | `--color-putih` | `#FFFFFF` |
| `tinta` | `--color-tinta` | `#14201B` |
| `tinta-lembut` | `--color-tinta-lembut` | `#5C6B64` |
| `garis` | `--color-garis` | `#E6E6E6` |
| `perhatian` | `--color-perhatian` | `#B45309` |
| `perhatian-tua` | `--color-perhatian-tua` | `#94420A` |
| `bahaya` | `--color-bahaya` | `#B42318` |

Radius: `--radius-tombol` 8 px, `--radius-kartu` 12 px, `--radius-hero` 16 px,
`--radius-pil` 999 px. Font: `--font-display` (Poppins) dan `--font-body` (Inter).

Halaman `apps/web/app/page.tsx` sekarang adalah Beranda katalog sesuai arah desain
B1: hero mint, kategori, barang terlaris, dan ajakan buka toko. Halaman status
internal M0 tidak lagi menjadi halaman utama.

Aturan kontras tetap berlaku di kode: teks putih hanya di atas `teal-aksi`
(`#0F6E66`), bukan di atas `teal` (`#198B81`). Teks di atas `mint` memakai
`teal-tua`; teks peringatan di atas `krem` memakai `perhatian-tua`. Teks minimum
16 px dan target sentuh minimum 44 px.

---

## 15. Implementasi M1

Layar onboarding S1–S4 sudah diimplementasikan di web:

| Layar desain | Route | Catatan implementasi |
| :--- | :--- | :--- |
| S1 Nomor HP | `/masuk`, `/jualan` | Input nomor HP, tanpa email |
| S2 Kode 6 angka | `/masuk`, `/jualan` | Enam kotak, kode demo `123456` tampil |
| S3 Nama toko | `/jualan` | Nama + kota + cerita toko |
| S4 Produk pertama | `/jualan` | Foto, 3 tips, nama, harga, berat |

Tambahan di luar S1–S4:

- `/akun` — profil, alamat, dan kartu toko.
- `/inbox` — daftar pesan dan kode masuk.
- Header bersama dengan tautan Buka toko, Inbox, dan nama pengguna.

Perbedaan kecil dari mockup: pilihan kota memakai lima wilayah seed; foto produk
disimpan lokal (bukan kamera langsung) dan bersifat opsional. Semua tetap memakai
token warna, radius, dan aturan teks yang sama.

---

## 16. Implementasi M2

Katalog sudah memakai data nyata dari database:

| Layar desain | Route | Catatan implementasi |
| :--- | :--- | :--- |
| B1 Beranda | `/` | Hero, kategori, 4 barang terlaris, CTA buka toko |
| B2 Cari | `/cari` | Pencarian, kategori, kota, harga, rating, urutan, halaman |
| B3 Detail produk | `/p/:slug` | Galeri, pilihan, stok, toko, ulasan |
| B4 Halaman toko | `/toko/:slug` | Profil toko, rating, barang per etalase |

Dashboard penjual sederhana ada di `/jualan/barang`: daftar barang, tambah/ubah,
pilihan dan stok, foto, etalase, aktif/nonaktif, dan soft delete. Desain dashboard
penjual yang lebih lengkap tetap dijadwalkan sebelum Sprint 8–10.

Foto produk memakai WebP target 32 KB dan `loading="lazy"`. Berat Beranda produksi
pada 390 px tercatat **488 KB**, di bawah batas 500 KB. Tombol keranjang pada detail
barang sudah aktif sejak Sprint 6.

---

## 17. Implementasi M3–M8

Alur transaksi memakai token dan komponen yang sama dengan M2.

| Layar | Route | Catatan |
| :--- | :--- | :--- |
| Keranjang | `/keranjang` | Kelompok per toko, pilih item, ubah jumlah |
| Bayar | `/bayar` | Alamat, kurir per toko, cara bayar, rincian |
| Instruksi bayar | `/pembayaran/:id` | Kode VA/QRIS, hitung mundur, simulasi bayar |
| Pesanan | `/pesanan` | Filter status, "uang saya di mana" |
| Detail pesanan | `/pesanan/:id` | Rincian, lacak, selesai, ulasan + foto |
| Komplain | `/pesanan/:id/komplain` | Bukti, diskusi, eskalasi |
| Lacak | `/lacak/:awb` | Timeline publik |
| Pesanan penjual | `/jualan/pesanan` | Terima/tolak, resi, label |
| Dompet | `/jualan/dompet` | Saldo, mutasi, tarik saldo |
| Pengaturan toko | `/jualan/toko` | Logo, bank, kurir |
| Admin | `/admin` | GMV, escrow, antrean |
| Resolusi | `/admin/komplain` | Keputusan dana |
| Pencairan | `/admin/pencairan` | Setujui/tolak |
| Toko & barang | `/admin/toko` | Moderasi |
| Demo console | `/dev` | Waktu, pembayaran, reset |

Aturan tampilan yang dijaga:

- Setiap status pesanan memakai label Bahasa Indonesia; tidak ada `WAITING_...`
  yang tampil ke pengguna.
- Tombol utama ada di bawah dan memenuhi target sentuh 44 px.
- Tidak ada promo, harga coret, hitung mundur promo, atau kolom email.
- Label PDF dan bukti transfer diberi tanda simulasi.
- Warna aksi tetap `#0F6E66`; tidak ada gradien atau drop shadow.

Galeri implementasi (390 x 844) ada di `docs/desain/ekspor/implementasi-m8-*.png`.
GIF ringkas 30 detik ada di `docs/bukti/demo-bakul.gif`; dibuat dari sepuluh
tangkapan layar alur pembeli, penjual, admin, dan demo console.

---

## 18. Audit UI/UX dan aksesibilitas (November 2026)

Audit dijalankan pada 31 tampilan halaman (390 px dan 1440 px), termasuk sesi
pembeli, penjual, admin, dan operator demo.

**Alat dan hasil**

| Alat | Cakupan | Hasil |
| :--- | :--- | :--- |
| axe-core 4.10.3 + Chrome | WCAG 2.1/2.2 AA dan best practice | 0 pelanggaran, 0 gambar tanpa teks alternatif, 0 kolom tanpa label |
| Lighthouse 12.8.2 (build produksi) | Beranda 390 px | Performa 97, Aksesibilitas 100, Best Practices 100, LCP 1,9 dtk, CLS 0 |
| Pemeriksaan keyboard | Skip link, fokus, menu akun, navigasi bawah | Fokus terlihat, Escape menutup menu, `aria-current` aktif |

**Perbaikan yang dilakukan**

1. Satu header bersama (`AppHeader`) untuk seluruh halaman: ikon cari, chat/Inbox,
   keranjang, dan menu akun. Tautan peran (Jualan, Admin, Demo console) pindah ke
   menu akun, tidak lagi memenuhi header.
2. Bottom nav lima tab dipakai konsisten di semua halaman pembeli, termasuk Inbox
   dan Akun. Item aktif memakai pil mint dan `aria-current="page"`. Halaman
   penjual dan admin memakai subnavigasi peran di bawah header (Ringkasan/Pesanan/
   Barang/Dompet/Toko, atau Dashboard/Komplain/Pencairan/Toko/Demo).
3. Token kontras baru: `teal-tua` untuk teks di atas mint dan `perhatian-tua` untuk
   teks peringatan di atas krem. Semua kombinasi teks lulus 4,5:1.
4. Skip link "Lewati ke konten", fokus global 3 px, dan state hover tombol.
5. Label ARIA diperbaiki: titik "belum dibaca" tidak lagi memakai `aria-label` pada
   elemen tanpa peran; jumlah badge diumumkan lewat nama tautan.
6. Filter Cari diringkas di mobile: kategori bisa digulir horizontal, filter kota/
   harga/rating/urutan berada di balik tombol "Filter lainnya".
7. Judul dokumen per halaman, sapaan pembeli memakai nama depan, dan pesan galat
   Beranda tidak lagi menyebut API/PostgreSQL.
8. Target sentuh ikon header, kolom cari, dan checkbox/radio diperbesar; teks badge
   angka dinaikkan ke 16 px.

**Catatan lanjutan**

- Performa Lighthouse diukur pada build produksi; server `next dev` memberi skor
  lebih rendah karena bundel pengembangan.
- Optimalisasi `srcset` foto produk masih terbuka; foto seed yang dipakai ulang
  berukuran lebih besar dari ukuran tampil.
- Halaman penjual/admin belum memakai sidebar; header bersama dan menu akun adalah
  langkah antara sampai sidebar peran dikerjakan.

---

## 19. Poles UI/UX dan Interaction Design (November 2026)

Bab ini mencatat lapisan interaksi yang ditambahkan setelah desain pertama.
Palet, tema, dan jenis huruf **tidak diubah** — semua perubahan memakai fondasi
warna yang sudah ada.

### 19.1 Token turunan

Empat token baru, semuanya turunan dari hue yang sudah ada. Tidak ada warna
merek baru.

| Token | Hex | Pemakaian |
| :--- | :--- | :--- |
| `bahaya-muda` | `#FBEAE8` | Latar badge "Stok habis", banner gagal, tombol "Buang" saat hover |
| `garis-kuat` | `#CBD4D0` | Border kartu terangkat, hover kartu, garis tabel |
| `garis-lembut` | `#F0F0F0` | Divider halus di dalam kartu, state nonaktif |
| `krem-terang` | `#FAF6EF` | Latar subnavigasi peran di bawah header |

Enam nilai warna lepas yang sebelumnya ditulis langsung di JSX (`#fbeae8`,
`#3c4a43`, `accent-[#0F6E66]`) sekarang memakai token.

### 19.2 Kebijakan gerak

Gaya tetap datar: **tanpa drop shadow dan tanpa gradien**. Kedalaman visual
dicapai lewat kombinasi border + latar, bukan bayangan.

| Token | Nilai | Pemakaian |
| :--- | :--- | :--- |
| `duration-cepat` | 120 ms | Hover ikon, chip, kartu |
| `duration-sedang` | 180 ms | Tombol, kartu produk, dialog |
| `duration-lambat` | 240 ms | Transisi halaman |
| `ease-standar` | `cubic-bezier(0.2, 0, 0, 1)` | Semua transisi |
| `animate-memuat` | 1,6 s, opacity 1 → 0,45 → 1 | Placeholder skeleton |
| `animate-muncul` | 180 ms, opacity + translateY 6 px | Dialog, toast |
| `animate-masuk` | 180 ms, opacity + scale 0,97 | Panel masuk |

Semua animasi dimatikan otomatis saat pengguna mengaktifkan
`prefers-reduced-motion: reduce`.

### 19.3 Komponen interaksi baru

| Komponen | Berkas | Peran |
| :--- | :--- | :--- |
| `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonRow`, `SkeletonGrid`, `SkeletonTable` | `components/skeleton.tsx` | Placeholder loading tanpa gradien |
| `ToastProvider`, `useToast` | `components/toast.tsx` | Notifikasi hasil aksi, `aria-live="polite"`, tutup otomatis 4 detik |
| `EmptyState` | `components/empty-state.tsx` | Ikon + judul + penjelasan + jalan keluar |
| `Modal` | `components/modal.tsx` | Dialog modal dengan focus trap, Escape, dan fokus kembali ke pemicu |
| `ConfirmDialog`, `useConfirm` | `components/confirm-dialog.tsx` | Menggantikan `window.confirm` |
| `PromptDialog` | `components/prompt-dialog.tsx` | Menggantikan `window.prompt` |
| `Field` | `components/field.tsx` | Label + petunjuk + galat, `aria-describedby` dan `aria-invalid` otomatis |
| `StatusBanner` | `components/status-banner.tsx` | Pesan status dalam konteks, bisa ditutup |
| `QuantityStepper` | `components/quantity-stepper.tsx` | Pengatur jumlah 44 px, dipakai keranjang dan detail barang |
| `RatingStars` | `components/rating-stars.tsx` | Rating dengan nilai terbaca pembaca layar |
| `CopyButton` | `components/copy-button.tsx` | Salin kode pembayaran atau resi |
| `PageHeader` | `components/page-header.tsx` | Kepala halaman seragam di semua rute |
| `MetricCard` | `components/metric-card.tsx` | Kartu angka dengan hierarki nilai/label/konteks |
| `AppBadgesProvider`, `useAppBadges` | `components/app-badges.tsx` | Satu pengambilan data untuk badge header dan navigasi bawah |

Sekitar 30 kelas baru tersedia di `components/ui.ts`: `selectClass`,
`textareaClass`, `fileInputClass`, `fieldErrorClass`, `hintClass`,
`chipActiveClass`, `ghostButtonClass`, `quietButtonClass`, `iconButtonClass`,
`containerClass`, `pageTitleClass`, `sectionTitleClass`, `eyebrowClass`,
`successBoxClass`, `warningBoxClass`, `skeletonClass`, dan lainnya.

### 19.4 Pola interaksi yang diterapkan

| Pola | Halaman |
| :--- | :--- |
| Placeholder skeleton | Cari, Detail barang, Toko, Keranjang, Bayar, Pembayaran, Pesanan, Detail pesanan, Lacak, Komplain, Inbox, Akun, Kelola barang, Dompet, Pengaturan toko, Admin, Demo console |
| Toast untuk hasil aksi | Profil, alamat, barang, etalase, pesanan, komplain, ulasan, tarik saldo, pencairan, reset demo |
| Dialog konfirmasi in-app | Keluar akun, buang barang, hapus alamat, hapus barang, hapus etalase, ubah etalase, batalkan komplain, selesai pesanan, tolak pesanan, setujui uang kembali, simpan keputusan, setujui/tolak pencairan, reset data demo |
| Dialog input teks | Ubah nama etalase, alasan menolak pesanan, catatan pencairan |
| Validasi inline di field | Nomor HP, nama profil, nama toko, nama dan harga barang, cerita komplain, alamat pengiriman |
| Empty state informatif | Keranjang, Cari, Toko, Pesanan, Pesanan masuk, Inbox, Akun, Kelola barang, Dompet, Admin (4), Demo console, Lacak, Komplain |
| Tombol lengket di mobile | Detail barang (tambah keranjang), Bayar (bayar sekarang), Keranjang |
| Kartu radio alih-alih `<select>` | Alamat kirim, pilihan kurir, cara bayar, kurir yang dilayani, keputusan dana |
| Ikon 28 baru | `components/icon.tsx` |

### 19.5 Penghapusan

`app/status-panel.tsx` dihapus. Komponen `StatusPanel` tidak diimpor di mana pun
dan sudah tidak lagi dipakai sejak halaman status internal M0 diganti Beranda.

### 19.6 Aturan yang dijaga

- Semua teks tetap ≥ 16 px. Badge "Stok habis" yang sebelumnya 14 px (`text-sm`)
  sekarang 16 px.
- Semua target sentuh tetap ≥ 44 px, termasuk tombol `−`/`+` pada stepper.
- Tanpa harga coret, badge diskon, hitung mundur promo, atau kolom email.
- Tanpa istilah teknis: escrow, checkout, invoice, VA, webhook, gateway,
  idempotensi.
- Tanpa drop shadow, gradien, atau mode gelap.
- Angka rupiah tetap integer; tidak ada pembulatan baru.

### 19.7 Hasil verifikasi

| Pemeriksaan | Alat | Hasil |
| :--- | :--- | :--- |
| Build dan tipe | `npm run build --workspace @bakul/web` | Lulus, 26 rute |
| Uji logika | `npm run test` | 24 uji lulus |
| Alur ujung ke ujung | `npm run test:e2e` | 5 skenario lulus |
| Aksesibilitas | axe-core 4.10.3, WCAG 2.1/2.2 AA + best practice | 0 pelanggaran di 20 tampilan (10 pembeli tanpa sesi, 5 pembeli dengan sesi, 5 admin/demo) |
| Error konsol | 13 halaman dipotret Playwright | 0 error JavaScript |
| Bukti visual | `docs/desain/ekspor/polish-*.png` | 12 tangkapan layar |

Audit aksesibilitas berjalan otomatis pada `npm run test:e2e` dan harus tetap
lulus 0 pelanggaran. Keputusan memakai `axe-core` sebagai dev dependency
dicatat di `docs/adr/0007-audit-aksesibilitas-otomatis.md`.

Skrip bukti visual dapat dijalankan ulang dengan:

```bash
npm run bukti:ui                          # menulis ke test-results/bukti/
BAKUL_BUKTI_DIR=docs/desain/ekspor npm run bukti:ui
```

### 19.8 Catatan operasional

- Kode OTP berlaku 10 menit pada jam demo. Dengan `DEMO_SPEED=60`, itu hanya
  sekitar 10 detik waktu nyata. Jalankan E2E setelah server sudah hangat,
  karena kompilasi halaman di `next dev` bisa memakan waktu tersebut.
- `npm run test:e2e` butuh PostgreSQL dan API yang hidup.

---

## 20. Seed katalog bersih (November 2026)

Seed demo diubah supaya aplikasi dimulai dari etalase yang bersih tanpa riwayat
transaksi. Ini memudahkan demo: setiap alur dimulai dari nol.

| Aspek | Sebelum | Sesudah |
| :--- | :--- | :--- |
| Pengguna | 12 (1 admin, 1 operator demo, 5 penjual, 5 pembeli) | **10** (1 admin, 8 penjual, 1 pembeli) |
| Toko | 5 | **8**, satu toko untuk satu kategori |
| Produk | 100, foto dipakai ulang 5 berkas | **32**, masing-masing punya foto sendiri |
| Foto | 5 berkas | **32 berkas** `katalog-*.jpg` + 5 arsip |
| Ulasan | 200 | **64** (2 per produk, dari pembeli demo) |
| Pesanan | 30+ | **0** |
| Jurnal ledger | 30+ | **0** |
| Dompet toko | ada | **0** |

### 20.1 Peta akun demo

| Peran | Nomor HP | Nama | Toko / fokus |
| :--- | :--- | :--- | :--- |
| Admin | `081200000001` | Admin Bakul | Dashboard, resolusi, pencairan, demo console |
| Penjual | `081200000011` | Sri Rahayu | Dapur Bu Sri — Kue Kering |
| Penjual | `081200000012` | Nah Rowiyah | Keripik Mbok Nah — Makanan Ringan |
| Penjual | `081200000013` | Asep Hidayat | Sembako Asep Jaya — Sembako |
| Penjual | `081200000014` | Yanto Wibowo | Kopi Lereng Tangsi — Minuman |
| Penjual | `081200000015` | Sekar Arum | Batik Sekar Arum — Fashion |
| Penjual | `081200000016` | Bagus Setiawan | Anyaman Nusantara — Kerajinan |
| Penjual | `081200000017` | Lestari Ningsih | Rempah Ayu — Perawatan Diri |
| Penjual | `081200000018` | Dian Puspita | Rumah Tangga Sejahtera — Rumah Tangga |
| Pembeli | `081200000021` | Sri Wahyuni | Dua alamat: Rumah (Sleman), Kantor (Bandung) |

Semua akun memakai kode demo `123456`.

### 20.2 Daftar 32 produk

| Toko | Produk |
| :--- | :--- |
| Dapur Bu Sri | Nastar Premium, Kastengel Keju, Putri Salju, Lidah Kucing Keju |
| Keripik Mbok Nah | Keripik Singkong Balado, Keripik Tempe, Kerupuk Udang, Kacang Goreng Bawang |
| Sembako Asep Jaya | Beras Organik Putih, Gula Aren, Minyak Kelapa, Telur Asin |
| Kopi Lereng Tangsi | Kopi Robusta Bubuk, Kopi Arabika Biji, Teh Melati, Sirup Markisa |
| Batik Sekar Arum | Kemeja Batik Tiga Negeri, Kebaya Nusantara, Selendang Batik, Kain Tenun Ikat |
| Anyaman Nusantara | Tas Anyaman Pandan, Bakul Rotan, Keranjang Bambu, Hiasan Dinding Anyaman |
| Rempah Ayu | Sabun Herbal, Lulur Kopi, Minyak Kelapa Wangi, Sikat Gigi Bambu |
| Rumah Tangga Sejahtera | Tikar Pandan, Keset Sabut, Tempat Tisu, Kap Lampu Bambu |

### 20.3 Beranda tanpa blok janji

Tiga kartu janji ("Uang aman", "Dikirim", "Komplain") dan baris gelap
"Uang ditahan aman sampai barang diterima" dihapus dari Beranda. Alasan: blok
itu mengulang pesan yang sudah ada di halaman pesanan dan pembayaran, dan
membuat Beranda lebih padat daripada yang dibutuhkan. Etalase langsung dimulai
dari sapaan, hero, dan kategori.

### 20.4 Perintah pemeliharaan

| Perintah | Fungsi |
| :--- | :--- |
| `npm run db:seed` | Menulis ulang katalog dan **mengosongkan seluruh transaksi** |
| `npm run demo:reset` | Mengosongkan transaksi saja; katalog tetap |

`seed-history.ts` dihapus karena tidak ada lagi riwayat transaksi yang dibuat
otomatis.


