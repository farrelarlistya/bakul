# State Machine Bakul

Status disimpan di database dan hanya berubah lewat layanan domain. Tabel di
bawah adalah sumber acuan untuk pengujian dan presentasi.

## 1. Pesanan (`order_invoices.order_status`)

```mermaid
stateDiagram-v2
    [*] --> WAITING_PAYMENT
    WAITING_PAYMENT --> WAITING_SELLER_CONFIRMATION: webhook PAID
    WAITING_PAYMENT --> CANCELLED_UNPAID: kedaluwarsa
    WAITING_SELLER_CONFIRMATION --> PROCESSING: penjual terima
    WAITING_SELLER_CONFIRMATION --> CANCELLED_BY_SELLER: tolak / SLA 48 jam
    PROCESSING --> READY_TO_SHIP: AWB dibuat
    READY_TO_SHIP --> SHIPPED: kurir ambil paket
    SHIPPED --> IN_TRANSIT: tiba di hub
    IN_TRANSIT --> DELIVERED: paket tiba
    DELIVERED --> COMPLETED: pembeli konfirmasi / auto 72 jam
    DELIVERED --> DISPUTED: pembeli komplain
    DISPUTED --> COMPLETED: penjual menang / komplain dicabut
    DISPUTED --> REFUNDED: pembeli menang / refund sebagian
    DISPUTED --> RETURNING: diputuskan retur
    RETURNING --> RETURNED: barang kembali
    RETURNING --> REFUNDED: refund setelah retur
```

Status final: `COMPLETED`, `REFUNDED`, `RETURNED`, `CANCELLED_UNPAID`,
`CANCELLED_BY_SELLER`.

## 2. Pembayaran (`payments.status`)

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> PAID: webhook payment.paid valid
    PENDING --> EXPIRED: lewat batas waktu
    PENDING --> FAILED: webhook payment.failed
    PAID --> REFUNDED: semua invoice direfund
    EXPIRED --> [*]
    FAILED --> [*]
    REFUNDED --> [*]
```

Batas waktu: VA 24 jam, QRIS 15 menit. Kedaluwarsa mengembalikan stok dan
membatalkan invoice.

## 3. Escrow (`order_invoices.escrow_status`)

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> HELD: pembayaran berhasil
    PENDING --> CANCELLED: tagihan kedaluwarsa
    HELD --> FROZEN: komplain diajukan
    HELD --> RELEASED: pesanan selesai
    HELD --> REFUNDED: batal / penjual menolak
    FROZEN --> RELEASED: penjual menang
    FROZEN --> REFUNDED: pembeli menang
    FROZEN --> PARTIALLY_REFUNDED: refund sebagian
    FROZEN --> HELD: komplain dicabut
    RELEASED --> [*]
    REFUNDED --> [*]
    PARTIALLY_REFUNDED --> [*]
```

Uang hanya berpindah saat status berubah dan jurnal ledger dibuat.

## 4. Pengiriman (`shipments.shipping_status`)

```text
AWB_CREATED -> PICKED_UP -> IN_TRANSIT -> ARRIVED_AT_DESTINATION
            -> OUT_FOR_DELIVERY -> DELIVERED
```

Timeline mock: +0 jam diambil, +3 jam hub asal, +14 jam transit, +26 jam tiba di
kota tujuan, +30 jam diantar, +32 jam diterima.

## 5. Komplain (`disputes.status`)

```text
WAITING_SELLER -> ESCALATED_TO_ADMIN -> RESOLVED_BUYER
                                     -> RESOLVED_SELLER
                                     -> RETURNING -> RESOLVED_BUYER
WAITING_SELLER -> CANCELLED_BY_BUYER
```

Aturan:

- Komplain hanya bisa diajukan saat invoice `DELIVERED` dan belum lewat 48 jam.
- Satu invoice hanya punya satu komplain.
- Komplain membekukan escrow dan menghentikan auto-complete.
- Penjual dapat langsung menyetujui refund.
- Admin dapat memutuskan dana ke penjual, refund penuh, refund sebagian, atau
  retur.

## 6. Pencairan (`withdrawals.status`)

```text
REQUESTED -> COMPLETED   (disetujui admin + jurnal keluar)
REQUESTED -> REJECTED    (saldo kembali ke dompet)
```

Minimum Rp50.000. Pengajuan mengunci saldo di `balance_withheld`; persetujuan
membuat jurnal `WITHDRAWAL` dan bukti transfer simulasi.

## 7. Penjaga transisi

| Lokasi | Penjaga |
| :--- | :--- |
| `checkout.service.ts` | stok, kurir, idempotensi, alamat |
| `payments.service.ts` | tanda tangan webhook, event unik, status PENDING |
| `order-lifecycle.service.ts` | SLA, auto-complete, refund, release, tracking |
| `seller-orders.service.ts` | kepemilikan invoice oleh penjual |
| `disputes.service.ts` | jendela 48 jam, satu dispute, peran peserta |
| `wallet.service.ts` | saldo cukup, minimum, idempotensi, status REQUESTED |

## 8. Uji yang menutup state machine

- `T-01` checkout multi-toko
- `T-02` anti-overselling
- `T-03` webhook idempoten
- `T-04` signature salah
- `T-05` kedaluwarsa mengembalikan stok
- `T-06` SLA penjual
- `T-07` auto-complete
- `T-08` komplain membekukan escrow
- `T-09` refund sebagian
- `T-10` tarik saldo melebihi saldo
- `T-11` ledger seimbang
- `T-12` akses lintas peran
- `T-14` bahasa antarmuka

Hasil terakhir ada di `docs/bukti/`.
