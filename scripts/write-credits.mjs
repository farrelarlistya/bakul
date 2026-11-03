/**
 * Menulis ulang `docs/desain/gambar/CREDITS.md` dari `sumber.json`.
 * Jalankan: node scripts/write-credits.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "docs/desain/gambar");

const rows = JSON.parse(await readFile(path.join(DIR, "sumber.json"), "utf8"));

function cell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

const catalog = rows.filter((row) => row.filename?.startsWith("katalog-"));
const legacy = rows.filter((row) => !row.filename?.startsWith("katalog-"));

const body = `# Kredit Foto — Bakul

Semua foto di folder ini berasal dari **Wikimedia Commons** dan dipakai sebagai
aset demo. Pada produksi, foto diganti dengan unggahan penjual.

Aturan: jangan menambahkan foto tanpa lisensi yang jelas. Lisensi yang diterima
hanya CC0, Public domain, CC BY, dan CC BY-SA.

## Foto katalog produk

Dipakai oleh \`npm run db:seed\` untuk 32 produk di 8 toko.

| Berkas | Foto asli | Pemilik | Lisensi | Sumber |
| :--- | :--- | :--- | :--- | :--- |
${catalog
  .map(
    (row) =>
      `| \`${cell(row.filename)}\` | ${cell(row.title.replace(/^File:/, "").replace(/\.(jpg|jpeg|png|JPG)$/, ""))} | ${cell(row.artist)} | ${cell(row.license)} | ${cell(row.url)} |`,
  )
  .join("\n")}

## Foto lama (Beranda dan arsip desain)

| Berkas | Foto asli | Pemilik | Lisensi | Sumber |
| :--- | :--- | :--- | :--- | :--- |
${legacy
  .map(
    (row) =>
      `| \`${cell(row.filename)}\` | ${cell(row.title.replace(/^File:/, "").replace(/\.(jpg|jpeg|png|JPG)$/, ""))} | ${cell(row.artist)} | ${cell(row.license)} | ${cell(row.url)} |`,
  )
  .join("\n")}

## Catatan

- Foto dipotong (\`cover\`) dan diperkecil menjadi WebP target ≤ 32 KB oleh seed;
  isinya tidak diubah.
- Lisensi CC BY / CC BY-SA mewajibkan atribusi. Atribusi dipenuhi oleh tabel di
  atas beserta tautan sumbernya. Jika proyek dipublikasikan, pertahankan berkas
  ini di repositori.
- Foto katalog dikumpulkan lewat \`scripts/fetch-product-photos.mjs\` yang
  menolak lisensi di luar daftar di atas.
- Turunan WebP hanya ada di folder \`storage/\` yang tidak di-commit.
`;

await writeFile(path.join(DIR, "CREDITS.md"), body);
console.log(`CREDITS.md ditulis: ${catalog.length} foto katalog, ${legacy.length} foto lama.`);
