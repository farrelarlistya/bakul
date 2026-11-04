# ADR 0007 — Audit aksesibilitas otomatis dengan axe-core

- Tanggal: 3 November 2026
- Status: digantikan — Playwright dan axe-core dihapus dari repo pada 4 November 2026
- Konteks: Sprint 12 (M9) — Poles UI/UX dan Interaction Design

## Konteks

Audit UI/UX November 2026 (lihat `docs/desain/design.md` bagian 18) memakai
axe-core 4.10.3 secara manual. Hasilnya dicatat di dokumen, tetapi tidak ada
mekanisme yang menjaga hasil itu tetap berlaku setelah Basis Kode berubah.

Poles Sprint 12 menambah lapisan interaksi besar: dialog modal, toast, empty
state, validasi inline, tombol lengket, dan kartu radio. Semua itu adalah
permukaan tempat regresi aksesibilitas paling mungkin terjadi — fokus yang
terjebak di luar dialog, `aria-describedby` yang tidak tersambung, tombol yang
kurang dari 44 px, atau teks di bawah 16 px.

## Keputusan

- `axe-core` **4.10.3** ditambahkan sebagai dev dependency di root
  `package.json`. Versi dipin persis, sama seperti seluruh dependency lain di
  repo.
- Audit dijalankan lewat Playwright (`e2e/audit-a11y.spec.ts`), bukan lewat
  CLI terpisah, supaya memakai server dan cookie yang sama dengan E2E lain.
- Aturan yang dijalankan: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`,
  `wcag22aa`, dan `best-practice`.
- Halaman yang diaudit: 10 halaman pembeli tanpa sesi, 5 halaman pembeli dengan
  sesi, dan 5 halaman admin/demo.
- Audit wajib lulus **0 pelanggaran** sebelum commit.

## Alasan memilih dependency ini

- `axe-core` hanya dipakai pada waktu pengujian. Tidak masuk bundel web, tidak
  menambah ukuran unduhan pengguna, dan tidak menambah beban runtime.
- Audit manual hanya bisa dilakukan sesekali. Audit otomatis bisa dijalankan
  setiap kali `apps/web` berubah, sehingga regresi aksesibilitas tertangkap
  sebelum merge.
- `axe-core` adalah standar de facto untuk audit WCAG otomatis dan tidak
  memerlukan browser tambahan — ia berjalan di dalam halaman lewat
  `addScriptTag`, memakai Chrome yang sudah terpasang.

## Alternatif yang ditolak

- **Menulis pemeriksaan sendiri.** Lebih murah, tetapi hanya memeriksa apa yang
  sudah diperiksa penulisnya sendiri. Aturan WCAG terlalu luas untuk ditirukan
  dengan benar.
- **Memakai `@axe-core/playwright`.** Integrasi lebih rapi, tetapi menambah satu
  paket lagi. `axe-core` saja sudah cukup karena injeksi skrip bisa dilakukan
  langsung lewat `page.addScriptTag`.
- **Memakai Lighthouse.** Mengukur performa dan SEO, bukan daftar pelanggaran
  aksesibilitas per elemen.

## Konsekuensi

- `npm install` sekarang mengambil satu paket tambahan untuk pengembangan.
- Audit aksesibilitas ikut berjalan pada `npm run test:e2e` dan membutuhkan
  PostgreSQL serta API yang hidup, seperti E2E yang sudah ada.
- Aturan `best-practice` dari axe kadang melaporkan hal yang bukan pelanggaran
  WCAG. Semua temuan tetap harus ditinjau manual, bukan diblokir tanpa alasan.
- Perubahan UI berikutnya harus menjaga 0 pelanggaran; regresi aksesibilitas kini
  tertangkap oleh build, bukan oleh temuan audit berikutnya.
