/**
 * Kelas dasar Bakul.
 *
 * Semua kelas di sini memakai token dari `app/globals.css`. Tidak ada nilai
 * warna lepas: kedalaman visual memakai border + latar, bukan drop shadow.
 * Gerak dibatasi pada warna, opacity, dan transform selama ≤180 ms.
 */

/* ---------- Tata letak ---------- */

export const containerClass = "mx-auto w-full max-w-[1200px] px-4";

export const containerFormClass = "mx-auto w-full max-w-3xl px-4";

export const containerReadClass = "mx-auto w-full max-w-2xl px-4";

/* ---------- Tipografi ---------- */

export const eyebrowClass = "text-base font-semibold text-teal-aksi";

export const pageTitleClass = "font-display text-3xl font-bold leading-tight text-tinta";

export const sectionTitleClass =
  "font-display text-2xl font-bold leading-tight text-tinta";

export const cardTitleClass = "text-lg font-semibold leading-6 text-tinta";

export const bodyClass = "text-base leading-6 text-tinta";

export const metaClass = "text-base leading-5 text-tinta-lembut";

/* ---------- Tombol ---------- */

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-tombol bg-teal-aksi px-5 text-base font-semibold text-putih transition duration-sedang ease-standar hover:bg-teal-tua active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-garis disabled:text-tinta-lembut disabled:active:scale-100";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-tombol border border-teal-aksi bg-putih px-5 text-base font-semibold text-teal-aksi transition duration-sedang ease-standar hover:bg-mint-muda active:scale-[0.98] disabled:cursor-not-allowed disabled:border-garis-kuat disabled:text-tinta-lembut disabled:active:scale-100";

export const dangerButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-tombol border border-bahaya bg-putih px-4 text-base font-semibold text-bahaya transition duration-sedang ease-standar hover:bg-bahaya-muda active:scale-[0.98] disabled:cursor-not-allowed disabled:border-garis-kuat disabled:text-tinta-lembut disabled:active:scale-100";

export const ghostButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-tombol border border-garis bg-putih px-4 text-base font-semibold text-tinta transition duration-sedang ease-standar hover:border-garis-kuat hover:bg-abu-kartu active:scale-[0.98] disabled:cursor-not-allowed disabled:text-tinta-lembut disabled:active:scale-100";

export const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-tombol px-3 text-base font-semibold text-teal-aksi transition duration-sedang ease-standar hover:bg-mint-muda active:scale-[0.98] disabled:cursor-not-allowed disabled:text-tinta-lembut disabled:active:scale-100";

export const iconButtonClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-tombol text-teal-aksi transition duration-sedang ease-standar hover:bg-mint-muda active:scale-95 disabled:cursor-not-allowed disabled:text-tinta-lembut";

/* ---------- Chip filter ---------- */

export const chipClass =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pil border border-garis bg-abu-kartu px-4 text-base font-semibold text-tinta transition duration-sedang ease-standar hover:border-garis-kuat hover:bg-garis-lembut active:scale-[0.98]";

export const chipActiveClass =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pil border border-teal-aksi bg-teal-aksi px-4 text-base font-semibold text-putih transition duration-sedang ease-standar active:scale-[0.98]";

/* ---------- Kartu ---------- */

export const cardClass = "rounded-kartu border border-garis bg-putih p-5";

export const cardRaisedClass = "rounded-kartu border border-garis-kuat bg-putih p-5";

export const interactiveCardClass =
  "rounded-kartu border border-garis bg-putih transition duration-sedang ease-standar hover:border-garis-kuat hover:bg-abu-kartu active:scale-[0.99]";

export const listRowClass =
  "flex flex-wrap items-center justify-between gap-3 rounded-kartu border border-garis bg-putih p-4 transition duration-sedang ease-standar hover:border-garis-kuat";

export const tableHeadClass =
  "px-3 py-3 text-left text-base font-semibold text-tinta-lembut";

/* ---------- Form ---------- */

export const inputClass =
  "min-h-11 w-full rounded-tombol border border-garis bg-putih px-3 text-base text-tinta outline-none transition duration-sedang ease-standar placeholder:text-tinta-lembut hover:border-garis-kuat focus:border-teal-aksi disabled:cursor-not-allowed disabled:bg-abu-kartu disabled:text-tinta-lembut";

export const selectClass = `select-field ${inputClass}`;

export const textareaClass =
  "min-h-24 w-full rounded-tombol border border-garis bg-putih px-3 py-3 text-base leading-6 text-tinta outline-none transition duration-sedang ease-standar placeholder:text-tinta-lembut hover:border-garis-kuat focus:border-teal-aksi disabled:cursor-not-allowed disabled:bg-abu-kartu disabled:text-tinta-lembut";

export const fileInputClass =
  "block min-h-11 w-full cursor-pointer rounded-tombol border border-dashed border-garis-kuat bg-abu-kartu px-3 py-2 text-base text-tinta transition duration-sedang ease-standar hover:border-teal-aksi hover:bg-mint-muda file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-tombol file:border-0 file:bg-teal-aksi file:px-4 file:text-base file:font-semibold file:text-putih";

export const labelClass = "mb-2 block text-base font-semibold text-tinta";

export const hintClass = "mt-1 text-base leading-5 text-tinta-lembut";

export const fieldErrorClass = "mt-1 text-base leading-5 text-bahaya";

/* ---------- Pesan ---------- */

export const errorBoxClass =
  "rounded-kartu border border-bahaya bg-bahaya-muda p-3 text-base text-bahaya";

export const successBoxClass =
  "rounded-kartu border border-teal bg-mint-muda p-3 text-base text-teal-tua";

export const infoBoxClass = "rounded-kartu border border-garis-kuat bg-abu-kartu p-3 text-base text-tinta";

export const warningBoxClass =
  "rounded-kartu border border-perhatian bg-krem p-3 text-base text-perhatian-tua";

/* ---------- Lain-lain ---------- */

export const skeletonClass = "animate-memuat rounded-tombol bg-abu-kartu";

export const pillClass =
  "inline-flex min-h-8 items-center gap-1 rounded-pil px-3 text-base font-semibold";
