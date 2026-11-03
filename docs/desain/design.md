# Spesifikasi Desain — Bakul

| Atribut | Nilai |
| :--- | :--- |
| Versi | 0.1 |
| Status | D1 selesai — menunggu review |
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
| `krem` | `#F1EADA` | Kartu kategori, blok ajakan buka toko |
| `abu-kartu` | `#F5F5F5` | Kartu produk, kolom pencarian |
| `putih` | `#FFFFFF` | Halaman, header, kartu |
| `tinta` | `#14201B` | Teks utama |
| `tinta-lembut` | `#5C6B64` | Teks sekunder (kontras 5,7:1 di putih) |
| `garis` | `#E6E6E6` | Pembatas, border |
| `perhatian` | `#B45309` | Stok hampir habis |
| `bahaya` | `#B42318` | Error, komplain |

Catatan kontras: `#198B81` dengan teks putih hanya ±4,1:1, sehingga **tidak dipakai
sebagai latar teks**. Latar tombol selalu `#0F6E66`.

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
8. `Atom/Nav Bawah` — 390×80, 4 tab
9. `Atom/Baris Kepercayaan` — 340×52

Input OTP dibuat sebagai enam frame (bukan komponen) karena tiap kotak perlu state
terpisah saat implementasi. Header atas dan bubble chat menyusul di D2–D3.

---

## 6. Daftar layar

| ID | Layar | Route | Requirement | Sesi | Status |
| :-- | :--- | :--- | :--- | :-- | :--- |
| F | Fondasi: token, tipe, atom | — | UX-1 | D1 | Selesai |
| B1 | Beranda (mobile + desktop) | `/` | CAT-1 | D1 | Selesai |
| B2 | Cari + filter | `/search` | CAT-1 | D2 | Belum |
| B3 | Detail produk | `/p/:slug` | CAT-2 | D2 | Belum |
| B4 | Halaman toko | `/toko/:slug` | CAT-3 | D2 | Belum |
| B5 | Keranjang multi-toko | `/cart` | CART-1 | D2 | Belum |
| B6 | Checkout | `/checkout` | CART-2 | D2 | Belum |
| B7 | Instruksi pembayaran | `/pay/:id` | PAY-1 | D2 | Belum |
| B8 | Pesanan saya | `/orders` | ORD-1 | D3 | Belum |
| B9 | Lacak paket | `/lacak/:awb` | ORD-1 | D3 | Belum |
| B10 | Komplain | `/orders/:id/komplain` | DSP-1 | D3 | Belum |
| S1–S4 | Buka toko 3 langkah | `/jualan` | ONB-1, ONB-2 | D3 | Belum |
| N1 | Inbox gaya WhatsApp | `/inbox` | NTF-1 | D3 | Belum |

Layar penjual lanjutan (dashboard, pesanan, dompet) dan admin didesain setelah
alur pembeli disetujui.

---

## 7. Isi Beranda

Urutan dari atas ke bawah (mobile):

1. Header: merek `bakul`, lonceng, keranjang, kolom cari.
2. Hero mint: judul "Dukung UMKM sekitarmu", subjudul "Uang aman sampai barang tiba",
   tombol "Mulai belanja", foto produk UMKM (tas anyaman).
3. Baris kepercayaan: "Uang ditahan aman" dan "Bantuan komplain".
4. Kategori: kartu krem, gulir horizontal.
5. Sedang laris: grid 2 kolom, foto asli, harga tanpa coretan, kota + rating,
   tombol "Tambah".
6. Navigasi bawah: Beranda, Pesanan, Keranjang, Akun.

Desktop menambahkan: menu atas, empat kategori sejajar, empat produk sejajar
(kota, rating, jumlah terjual), blok ajakan "Punya dagangan? Buka toko gratis",
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

| Kebutuhan | Berkas | Lisensi |
| :--- | :--- | :--- |
| Hero | `hero-tas-anyaman.jpg` | CC0 |
| Nastar | `produk-nastar.jpg` | CC0 |
| Keripik | `produk-keripik.jpg` | CC BY-SA 4.0 |
| Kopi | `produk-kopi.jpg` | CC BY 4.0 |
| Batik | `produk-batik.jpg` | CC BY-SA 3.0 nl |

Atribusi lengkap ada di `docs/desain/gambar/CREDITS.md`. Foto diperkecil (maksimal
1200 px) agar berkas desain tidak terlalu besar, lalu dipotong di dalam frame.
Pada produksi, foto diganti dengan unggahan penjual.

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
- Belum ada state kosong, memuat, dan error; dibuat bersama layar terkait di D2.
- Warna belum di-bind ke variabel `Core` di setiap lapisan. Variabel sudah ada dan
  siap diekspor ke Tailwind; binding menyeluruh dilakukan saat implementasi agar
  tidak ada nilai lepas.
- Foto berasal dari Wikimedia Commons (lihat `CREDITS.md`) dan harus diganti dengan
  foto penjual saat produksi.
- Berkas `bakul.figcraft` berukuran ± 7,7 MB karena menyimpan riwayat gambar.
  Jika tumbuh melebihi 50 MB, pindahkan ke Git LFS.
