# ADR 0005 — Katalog, etalase, dan foto WebP

- Tanggal: 3 November 2026
- Status: diterima
- Konteks: Sprint 5 (M2)

## Keputusan katalog

- Produk yang tampil hanya `status = ACTIVE` dan tokonya `ACTIVE`.
- Pencarian memakai `contains` case-insensitive pada nama/deskripsi.
- Filter kategori memakai slug, kota memakai `shops.cityName`, harga memakai varian,
  rating memakai `products.avg_rating`.
- Urutan `terbaru`, `terlaris`, `harga-asc`, `harga-desc` dihitung setelah query.
  Dataset lokal 100 produk, jadi pengurutan di aplikasi masih memadai. Jika data
  tumbuh, urutan harga harus dipindah ke SQL/aggregate.
- Pagination memakai `page` dan `limit` (maksimal 48).
- Soft delete memakai `status = DELETED`; katalog menyembunyikannya, penjual masih
  melihatnya di daftar.
- `shop_etalases` mengelompokkan barang per toko. Menghapus etalase tidak menghapus
  barang; `etalase_id` menjadi `NULL`.
- Ulasan ditampilkan dari tabel `reviews`. Relasi ke `order_item` ditambahkan saat
  pesanan sudah ada (Sprint 6+); saat ini ulasan seed dipakai untuk tampilan.

## Keputusan foto

- `sharp` 0.35.5 ditambahkan ke API karena kebutuhan nyata: konversi unggahan ke
  WebP, resize, dan penurunan kualitas sampai ≤32 KB.
- Foto seed juga dibuat WebP dari aset Wikimedia di `docs/desain/gambar` saat
  `npm run db:seed`. File hasil ada di `storage/products` (gitignored).
- Nama file UUID; tidak memakai nama asli pengguna.
- Foto produk disajikan lewat API (`/api/v1/files/products/:filename`), bukan
  folder public Next.js, agar adapter storage bisa diganti nanti.
- Maksimal 5 foto per barang; unggahan maksimal 2 MB sebelum dikompresi.

## Konsekuensi

- `sharp` adalah dependency native; `npm install` membutuhkan binari yang tersedia
  untuk Windows x64. Ini sudah terpasang di mesin pengembangan.
- Seed membutuhkan aset sumber di `docs/desain/gambar`; tanpa aset itu seed gagal.
- Pengurutan harga di memori tidak efisien untuk katalog besar. Catatan ini menjadi
  tiket peningkatan saat jumlah produk bertambah.
- Foto lama tidak otomatis dihapus saat barang dihapus permanen; untuk soft delete,
  file tetap dipakai jika barang dipulihkan.
