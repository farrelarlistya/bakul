export function maskPhone(phone: string): string {
  if (phone.length <= 6) {
    return "***";
  }

  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

/**
 * Isi pesan WhatsApp. Hanya template yang benar-benar dipakai yang diterima,
 * supaya kode OTP tidak pernah ikut ke template lain.
 */
export function buildWhatsAppMessage(
  template: string,
  data: Record<string, unknown>,
): string {
  if (template === "OTP") {
    const code = typeof data["code"] === "string" ? data["code"] : "";
    const ttlMinutes =
      typeof data["ttlMinutes"] === "number" ? data["ttlMinutes"] : 10;

    if (!/^\d{6}$/.test(code)) {
      throw new Error("Kode OTP tidak valid.");
    }

    return `Kode masuk Bakul kamu: ${code}. Berlaku ${ttlMinutes} menit. Jangan bagikan kode ini ke siapa pun.`;
  }

  if (template === "OTP_TEST") {
    return "Pesan uji dari Bakul. Jika kamu menerima ini, pengiriman WhatsApp sudah berfungsi.";
  }

  if (typeof data["message"] === "string" && data["message"].trim().length > 0) {
    return data["message"].trim();
  }

  throw new Error(`Template WhatsApp belum didukung: ${template}`);
}
