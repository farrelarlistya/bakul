# ADR 0004 — Foto produk lokal

- Tanggal: 3 November 2026
- Status: diterima
- Konteks: Sprint 4 (M1)

## Keputusan

Foto produk pertama disimpan di penyimpanan lokal:

- Folder default: `storage/products` di root repo (gitignored).
- `STORAGE_DIR` dapat menimpa lokasi folder.
- Format: JPG, PNG, atau WebP.
- Ukuran maksimal: 2 MB.
- Nama file: UUID + ekstensi, bukan nama asli pengguna.
- Metadata disimpan di tabel `product_images` (`url`, `position`).
- URL publik: `/api/v1/files/products/:filename`.
- File disajikan oleh API dengan `Cache-Control: public, max-age=86400`.

## Alasan

- Sprint 4 hanya membutuhkan satu foto untuk produk pertama; belum perlu CDN,
  object storage, atau pipeline gambar.
- Menyimpan file di luar database menjaga baris database tetap kecil.
- Nama UUID mencegah tabrakan dan path traversal; nama file divalidasi dengan
  regex sebelum dibaca.
- `product_images` sudah disiapkan agar Sprint 5 bisa menambah galeri dan
  penghapusan foto tanpa mengubah tabel produk.

## Belum dilakukan

- Kompresi/konversi WebP otomatis dan target ≤ 40 KB (dijadwalkan Sprint 5).
- Crop/thumbnail beberapa ukuran.
- Pembersihan file yatim otomatis jika upload berhasil tetapi penyimpanan database
  gagal. Saat ini file dihapus pada jalur error yang diketahui.

## Konsekuensi

- `storage/` tidak boleh di-commit.
- Clone baru tidak membawa foto; seed tidak memakai foto produk.
- Jika folder storage dipindah, `STORAGE_DIR` harus diisi dan file lama dipindahkan
  manual.
