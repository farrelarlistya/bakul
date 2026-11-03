/**
 * Alat pengumpul foto produk dari Wikimedia Commons.
 *
 * Dua mode:
 *   node scripts/fetch-product-photos.mjs --list
 *     Menampilkan kandidat foto (judul, lisensi, pemilik) untuk setiap istilah.
 *   node scripts/fetch-product-photos.mjs --fetch
 *     Mengunduh foto yang sudah dipilih di PRODUCTS, lalu menulis ulang
 *     `docs/desain/gambar/sumber.json` dan tabel kredit.
 *
 * Hanya lisensi bebas yang dipakai: CC0, Public domain, CC BY, CC BY-SA.
 * Foto disimpan sebagai JPEG lalu diperkecil menjadi WebP oleh seed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGE_DIR = path.join(ROOT, "docs/desain/gambar");
const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "BakulAssetCollector/1.0 (local development seed assets)";

const ALLOWED = /^(CC0|Public domain|CC BY( |-|$)|CC BY-SA( |-|$))/i;

/** Istilah pencarian untuk setiap produk. */
const SEARCH_TERMS = [
  ["nastar", "nastar kue kering"],
  ["kastengel", "kastengel keju"],
  ["putri-salju", "putri salju kue"],
  ["lidah-kucing", "lidah kucing kue"],
  ["keripik-singkong", "keripik singkong balado"],
  ["keripik-tempe", "keripik tempe"],
  ["kerupuk-udang", "kerupuk udang"],
  ["kacang-bawang", "kacang bawang"],
  ["beras", "beras putih"],
  ["gula-aren", "gula aren"],
  ["minyak-kelapa", "minyak kelapa"],
  ["telur-asin", "telur asin"],
  ["kopi-robusta", "kopi robusta bubuk"],
  ["kopi-arabika", "kopi arabika biji"],
  ["teh-melati", "teh melati"],
  ["sirup-gula", "sirup gula"],
  ["kemeja-batik", "kemeja batik"],
  ["blus-batik", "blus batik"],
  ["selendang-batik", "selendang batik"],
  ["kain-lurik", "kain lurik tenun"],
  ["tas-pandan", "tas anyaman pandan"],
  ["bakul-rotan", "bakul rotan"],
  ["topi-anyaman", "topi anyaman bambu"],
  ["rotan-dinding", "hiasan dinding rotan"],
  ["sabun-sereh", "sabun sereh"],
  ["lulur-rempah", "lulur rempah"],
  ["minyak-kelapa-wangi", "minyak kelapa botol"],
  ["sikat-bambu", "sikat gigi bambu"],
  ["tikar-pandan", "tikar pandan"],
  ["keset", "keset kain"],
  ["tempat-tisu", "tempat tisu anyaman"],
  ["lampu-bambu", "lampu bambu"],
];

/**
 * Foto terpilih. Diisi setelah meninjau keluaran `--list`.
 * `title` harus sama persis dengan judul berkas di Commons (tanpa "File:").
 */
const PRODUCTS = [
  // Kue Kering — Dapur Bu Sri
  { key: "nastar", title: "Kue Nastar Prabumulih.jpg" },
  { key: "kastengel", title: "Kastengel 2.JPG" },
  { key: "putri-salju", title: "Kue putri salju.JPG" },
  { key: "lidah-kucing", title: "Kue Lidah Kucing Keju.jpg" },
  // Makanan Ringan — Keripik Mbok Nah
  { key: "keripik-singkong", title: "Keripik Singkong Balado.jpg" },
  { key: "keripik-tempe", title: "Keripik Tempe Malang 042612.jpg" },
  { key: "kerupuk-udang", title: "Kerupuk udang.JPG" },
  { key: "kacang-goreng", title: "Kacang goreng fried peanuts.JPG" },
  // Sembako — Sembako Asep Jaya
  { key: "beras", title: "Beras organik putih.jpg" },
  { key: "gula-aren", title: "Gula Aren Asli Puncak Pato.jpg" },
  {
    key: "minyak-kelapa",
    title: "Coconut oil bottle in the background of coconuts from Kaleeswari Farm.jpg",
  },
  { key: "telur-asin", title: "Telur Asin DARA.jpg" },
  // Minuman — Kopi Lereng Tangsi
  { key: "kopi-robusta", title: "Coarsely grounded coffee beans in white bowl with intact roasted bean.png" },
  { key: "kopi-arabika", title: "Roasted coffee beans in white bowl.png" },
  { key: "teh-melati", title: "Jasmine tea pearls.jpg" },
  { key: "sirup-markisa", title: "Sirup Markisa khas Makassar-1.jpg" },
  // Fashion — Batik Sekar Arum
  { key: "kemeja-batik", title: "Produk Siap Pakai Kemeja Batik Tiga Negeri.jpg" },
  { key: "kebaya", title: "Kebaya Nusantara.jpg" },
  { key: "selendang-batik", title: "Kain Selendang Batik Tiga Negeri Lasem.jpg" },
  { key: "tenun-ikat", title: "Tenun Ikat Lombok.JPG" },
  // Kerajinan — Anyaman Nusantara
  {
    key: "tas-pandan",
    title: "Collectie Wereldmuseum, TM-1374-23, Tas, 'Tas met hengsel voor het bewaren van tabak, gevlochten van repen pandanblad', voor 1940.jpg",
  },
  { key: "bakul-rotan", title: "Shengzhou Bamboo Weaving Basket in Zhejiang Provincial Museum 2014-04.JPG" },
  { key: "keranjang-bambu", title: "Anyaman bambu-Kalo.jpg" },
  { key: "hiasan-bambu", title: "Anyaman buluh sebagai cenderahati di Kampung Kuala Lah 1.jpg" },
  // Perawatan Diri — Rempah Ayu
  { key: "sabun-herbal", title: "Handmade soap.jpg" },
  { key: "lulur-kopi", title: 'Nuga Body Scrub "Energizing Coffee".jpg' },
  { key: "minyak-kelapa-wangi", title: "Coconut oil 2.jpg" },
  { key: "sikat-bambu", title: "Humble Brush.jpg" },
  // Rumah Tangga — Rumah Tangga Sejahtera
  { key: "tikar-pandan", title: "Tikar Rompok.jpg" },
  { key: "keset", title: "Coir doormat.jpg" },
  { key: "tempat-tisu", title: "Kotak tisu biodegradasi.jpg" },
  { key: "kap-lampu", title: "This is a handmade cylindrical bamboo or cane lamp shade.jpg" },
];

/** Foto lama yang tetap dipakai halaman Beranda dan dokumentasi desain. */
const LEGACY = [
  {
    title: "File:Tas Anyaman Rotan.jpg",
    artist: "SilviaMamas",
    license: "CC0",
    url: "https://commons.wikimedia.org/wiki/File:Tas_Anyaman_Rotan.jpg",
    filename: "hero-tas-anyaman.jpg",
  },
  {
    title: "File:Tat nanas (Pineapple tart) 20230425 084103.jpg",
    artist: "Wiki Farazi",
    license: "CC0",
    url: "https://commons.wikimedia.org/wiki/File:Tat_nanas_(Pineapple_tart)_20230425_084103.jpg",
    filename: "produk-nastar.jpg",
  },
  {
    title: "File:Tapioca Chips 2.jpg",
    artist: "Gaurav Dhwaj Khadka",
    license: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Tapioca_Chips_2.jpg",
    filename: "produk-keripik.jpg",
  },
  {
    title: "File:Roasted coffee beans in white bowl.png",
    artist: "Alorin",
    license: "CC BY 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Roasted_coffee_beans_in_white_bowl.png",
    filename: "produk-kopi.jpg",
  },
  {
    title: "File:Batik Indonesia.jpg",
    artist: "MartijnL",
    license: "CC BY-SA 3.0 nl",
    url: "https://commons.wikimedia.org/wiki/File:Batik_Indonesia.jpg",
    filename: "produk-batik.jpg",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(params, attempt = 1) {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json", origin: "*" })}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (response.status === 429 && attempt <= 5) {
    const wait = 3000 * attempt;
    console.log(`   (429, tunggu ${wait / 1000} dtk lalu coba lagi)`);
    await sleep(wait);
    return api(params, attempt + 1);
  }
  if (!response.ok) {
    throw new Error(`Commons ${response.status} untuk ${params.gsrsearch ?? params.titles}`);
  }
  return response.json();
}

function metadata(page) {
  const info = page.imageinfo?.[0] ?? {};
  const meta = info.extmetadata ?? {};
  return {
    title: String(page.title).replace(/^File:/, ""),
    width: info.width ?? 0,
    height: info.height ?? 0,
    thumb: info.thumburl ?? info.url ?? "",
    page: info.descriptionurl ?? "",
    license: meta.LicenseShortName?.value ?? "",
    artist: (meta.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  };
}

async function list() {
  for (const [key, term] of SEARCH_TERMS) {
    const data = await api({
      action: "query",
      generator: "search",
      gsrsearch: `${term} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "6",
      prop: "imageinfo",
      iiprop: "url|extmetadata|size",
      iiurlwidth: "900",
    });
    const pages = Object.values(data?.query?.pages ?? {}).map(metadata);
    console.log(`\n## ${key}  <- "${term}"`);
    for (const page of pages) {
      const flag = ALLOWED.test(page.license) ? "OK " : "-- ";
      console.log(`  ${flag}${page.license.padEnd(18)} ${String(page.width).padStart(5)}px  ${page.artist.slice(0, 30).padEnd(30)}  ${page.title}`);
    }
    await sleep(2200);
  }
}

async function fetchOne(key, title) {
  const data = await api({
    action: "query",
    titles: `File:${title}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "1000",
  });
  const pages = Object.values(data?.query?.pages ?? {});
  const page = pages[0];
  if (!page || page.missing !== undefined) {
    throw new Error(`Foto tidak ditemukan: ${title}`);
  }
  const info = metadata(page);
  if (!ALLOWED.test(info.license)) {
    throw new Error(`Lisensi tidak diizinkan (${info.license}): ${title}`);
  }

  const response = await fetch(info.thumb, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Unduhan gagal ${response.status}: ${title}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `katalog-${key}.jpg`;
  await writeFile(path.join(IMAGE_DIR, filename), buffer);
  console.log(`ok ${filename}  ${Math.round(buffer.length / 1024)} KB  ${info.license}`);

  return {
    key,
    filename,
    title: info.title,
    artist: info.artist,
    license: info.license,
    page: info.page,
  };
}

async function fetchAll() {
  if (PRODUCTS.length === 0) {
    throw new Error("PRODUCTS masih kosong. Isi dulu setelah meninjau --list.");
  }
  await mkdir(IMAGE_DIR, { recursive: true });

  const results = [];
  for (const product of PRODUCTS) {
    results.push(await fetchOne(product.key, product.title));
    await sleep(2200);
  }

  const sumberPath = path.join(IMAGE_DIR, "sumber.json");

  const merged = [
    ...LEGACY,
    ...results.map((row) => ({
      title: `File:${row.title}`,
      artist: row.artist,
      license: row.license,
      url: row.page,
      filename: row.filename,
    })),
  ];
  await writeFile(sumberPath, `${JSON.stringify(merged, null, 4)}\n`);
  console.log(`\n${results.length} foto diunduh. sumber.json ditulis ulang (${merged.length} baris).`);
  for (const row of results) {
    console.log(
      `| \`${row.filename}\` | ${row.title} | ${row.artist} | ${row.license} | ${row.page} |`,
    );
  }
}

const mode = process.argv.includes("--fetch")
  ? "fetch"
  : process.argv.includes("--terms")
    ? "terms"
    : "list";

if (mode === "terms") {
  const raw = process.argv[process.argv.indexOf("--terms") + 1] ?? "";
  for (const term of raw.split("|").filter(Boolean)) {
    const data = await api({
      action: "query",
      generator: "search",
      gsrsearch: `${term} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "6",
      prop: "imageinfo",
      iiprop: "url|extmetadata|size",
      iiurlwidth: "900",
    });
    const pages = Object.values(data?.query?.pages ?? {}).map(metadata);
    console.log(`\n## "${term}"`);
    for (const page of pages) {
      const flag = ALLOWED.test(page.license) ? "OK " : "-- ";
      console.log(`  ${flag}${page.license.padEnd(18)} ${String(page.width).padStart(5)}px  ${page.artist.slice(0, 28).padEnd(28)}  ${page.title}`);
    }
    await sleep(2200);
  }
} else if (mode === "list") {
  await list();
} else {
  await fetchAll();
}
