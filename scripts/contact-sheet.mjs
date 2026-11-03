/**
 * Membuat contact sheet 32 foto katalog untuk pemeriksaan visual.
 * Jalankan: node scripts/contact-sheet.mjs
 */
import { readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "docs/desain/gambar");
const OUT = path.join(ROOT, "test-results/kontak/kontak-katalog.jpg");

const files = (await readdir(DIR))
  .filter((name) => name.startsWith("katalog-") && name.endsWith(".jpg"))
  .sort();

const CELL = 210;
const COLS = 6;
const ROWS = Math.ceil(files.length / COLS);

const composites = [];
for (const [index, file] of files.entries()) {
  const tile = await sharp(path.join(DIR, file))
    .resize(CELL, CELL, { fit: "cover", position: "attention" })
    .toBuffer();
  composites.push({
    input: tile,
    left: (index % COLS) * CELL,
    top: Math.floor(index / COLS) * CELL,
  });
}

await mkdir(path.dirname(OUT), { recursive: true });
await sharp({
  create: {
    width: COLS * CELL,
    height: ROWS * CELL,
    channels: 3,
    background: { r: 255, g: 255, b: 255 },
  },
})
  .composite(composites)
  .jpeg({ quality: 82 })
  .toFile(OUT);

await writeFile(
  path.join(path.dirname(OUT), "urutan.txt"),
  files.map((file, index) => `${index + 1}. ${file}`).join("\n"),
);

console.log(`${files.length} foto -> ${OUT}`);
