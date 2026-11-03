/**
 * Uang di Bakul selalu integer rupiah. Fungsi ini menolak pecahan agar
 * kesalahan pembulatan tidak menyebar ke keranjang, tagihan, atau ledger.
 */
export function formatRupiah(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error("Nominal rupiah harus bilangan bulat.");
  }

  const sign = amount < 0 ? "-" : "";
  const digits = Math.abs(amount).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${sign}Rp ${grouped}`;
}
