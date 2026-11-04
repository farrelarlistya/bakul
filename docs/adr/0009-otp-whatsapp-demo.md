# ADR 0009 — OTP WhatsApp sungguhan untuk demo internal

- Tanggal: 4 November 2026
- Status: diterima
- Konteks: demo internal dengan kode OTP sungguhan

## Konteks

PRD v0.2 menaruh pengiriman OTP nyata di luar lingkup (§5.2). Untuk demo
internal, pemilik proyek memutuskan memakai OTP sungguhan lewat WhatsApp agar
alur login terasa seperti produksi. Demo Console dan time machine tetap dipakai,
jadi `DEMO_MODE` tidak boleh dimatikan hanya untuk mengaktifkan OTP nyata.

Belum ada akun vendor. Fonnte dipilih karena sudah disebut PRD sebagai
implementasi `Notifier` masa depan dan tidak memerlukan WhatsApp Business API.

## Keputusan

- Tambah env `OTP_DELIVERY` dengan nilai `demo` atau `whatsapp`.
  - `demo`: kode `123456`, ditampilkan di UI dan Inbox.
  - `whatsapp`: kode 6 angka acak, dikirim lewat adapter, tidak pernah masuk
    response atau log.
- `DEMO_MODE` tetap mengatur fitur demo lain (Demo Console, time machine,
  operator demo). `OTP_DELIVERY` terpisah supaya keduanya bisa hidup bersama.
- Bila `OTP_DELIVERY` kosong, nilainya diturunkan dari `DEMO_MODE`: `true` →
  `demo`, `false` → `whatsapp`.
- Provider dipilih lewat `NOTIFIER_PROVIDER`:
  - `mock` (default) → `MockNotifier`, hanya log.
  - `fonnte` → `FonnteNotifier`, memanggil `https://api.fonnte.com/send`.
- `OTP_DELIVERY=whatsapp` mewajibkan `NOTIFIER_PROVIDER=fonnte` dan
  `FONNTE_TOKEN`. API menolak start bila konfigurasi belum lengkap.
- Jika pengiriman gagal, OTP dihapus dan API mengembalikan `OTP_DELIVERY_FAILED`
  dengan pesan langkah berikutnya. Pengguna bisa langsung mencoba lagi tanpa
  menunggu jendela 10 menit.
- Kode OTP tetap disimpan sebagai HMAC-SHA256 dengan `OTP_PEPPER`, berlaku 10
  menit, maksimal 3 permintaan/10 menit per nomor, dan 5 percobaan per kode.
- `npm run otp:test` mengirim pesan uji tanpa membuat OTP di database.

## Alternatif yang ditolak

- **WhatsApp Business API resmi (Meta).** Lebih andal, tetapi memerlukan akun
  bisnis, verifikasi, template pesan, dan proses persetujuan. Terlalu berat untuk
  demo internal.
- **SMS agregator lokal.** Sesuai untuk produksi, tetapi memerlukan pendaftaran
  sender ID dan biaya per SMS. Bisa ditambahkan sebagai adapter lain nanti.
- **Twilio.** Andal, tetapi lebih mahal untuk Indonesia dan tetap memerlukan
  pengaturan sender.
- **Firebase Phone Auth.** Menambah SDK dan menyerahkan alur OTP ke Google;
  tidak sejalan dengan OTP kustom yang sudah diuji.
- **Mematikan `DEMO_MODE`.** Akan menghilangkan Demo Console dan time machine
  yang justru dipakai saat demo.

## Konsekuensi

- Perlu akun Fonnte, nomor WhatsApp pengirim yang terhubung, dan token perangkat.
- Login bergantung pada internet dan layanan Fonnte. Jika Fonnte gagal, login
  dengan OTP WhatsApp juga gagal; mode demo tetap tersedia sebagai cadangan.
- Fonnte adalah gateway WhatsApp, bukan WhatsApp Business API resmi. Risiko
  pembatasan nomor atau perubahan layanan ada di pihak vendor.
- Pengiriman pesan berbiaya sesuai kuota akun. Batas 3 permintaan/10 menit per
  nomor sudah ada, tetapi belum ada batas per IP atau harian. Untuk demo internal
  dengan tautan yang dibagikan terbatas, risiko ini diterima.
- `FONNTE_TOKEN` adalah rahasia dan hanya boleh ada di `.env`.
- E2E dan pengujian otomatis tetap memakai `OTP_DELIVERY=demo`; pengujian nyata
  dilakukan manual dengan satu nomor.
