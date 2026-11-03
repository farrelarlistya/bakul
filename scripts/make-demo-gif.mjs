import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import gifenc from "gifenc";

const { GIFEncoder, applyPalette, quantize } = gifenc;

const frames = [
  "implementasi-m8-beranda.png",
  "implementasi-m8-keranjang.png",
  "implementasi-m8-bayar.png",
  "implementasi-m8-pembayaran.png",
  "implementasi-m8-pesanan.png",
  "implementasi-m8-penjual-pesanan.png",
  "implementasi-m8-dompet.png",
  "implementasi-m8-admin.png",
  "implementasi-m8-admin-komplain.png",
  "implementasi-m8-demo.png",
];

const directory = path.resolve("docs/desain/ekspor");
const output = path.resolve("docs/bukti/demo-bakul.gif");

const gif = GIFEncoder();

for (const name of frames) {
  const input = await readFile(path.join(directory, name));
  const { data, info } = await sharp(input)
    .resize({ width: 270, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  gif.writeFrame(index, info.width, info.height, {
    palette,
    delay: 3000,
    repeat: 0,
  });
}

gif.finish();
await writeFile(output, gif.bytes());
console.log(`GIF 30 detik ditulis ke ${output}`);
