import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../src/generated/prisma/client";
import { ProductStatus, ShopStatus, UserRole } from "../src/generated/prisma/enums";
import { productPhotoDir } from "../src/common/storage/storage.paths";

config({ path: "../../.env", quiet: true });
config({ quiet: true });

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error(
    "DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi kredensial PostgreSQL.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/**
 * Seed demo Bakul.
 *
 * Isi: 1 admin, 8 penjual (satu per kategori), 1 pembeli, 8 toko, 32 produk
 * dengan foto masing-masing. **Tidak ada satu pun transaksi** — pesanan,
 * pembayaran, dompet, dan ledger sengaja kosong supaya demo dimulai dari
 * etalase bersih.
 */

const PHOTO_BUDGET_BYTES = 32 * 1024;

type SeedUser = {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: UserRole;
  isVerified: boolean;
};

type SeedShop = {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  description: string;
  cityId: string;
  cityName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  supportedCouriers: string[];
};

type SeedCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

type SeedEtalase = {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  sortOrder: number;
};

type SeedAddress = {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  districtId: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
};

type SeedProduct = {
  id: string;
  shopId: string;
  categoryId: string;
  etalaseId: string | null;
  photoKey: string;
  name: string;
  slug: string;
  description: string;
  weightGram: number;
  status: ProductStatus;
  avgRating: number;
  soldCount: number;
};

type SeedVariant = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  stockAvailable: number;
  stockReserved: number;
};

function seedId(group: number, index: number): string {
  return `${group.toString(16).padStart(8, "0")}-0000-4000-8000-${index
    .toString(16)
    .padStart(12, "0")}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ------------------------------------------------------------------ */
/* Pengguna: 1 admin, 8 penjual (satu per kategori), 1 pembeli         */
/* ------------------------------------------------------------------ */

const users: SeedUser[] = [
  {
    id: seedId(1, 1),
    phone: "081200000001",
    email: "admin@bakul.test",
    name: "Admin Bakul",
    role: UserRole.ADMIN,
    isVerified: true,
  },
  {
    id: seedId(1, 11),
    phone: "081200000011",
    email: "penjual1@bakul.test",
    name: "Sri Rahayu",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 12),
    phone: "081200000012",
    email: "penjual2@bakul.test",
    name: "Nah Rowiyah",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 13),
    phone: "081200000013",
    email: "penjual3@bakul.test",
    name: "Asep Hidayat",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 14),
    phone: "081200000014",
    email: "penjual4@bakul.test",
    name: "Yanto Wibowo",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 15),
    phone: "081200000015",
    email: "penjual5@bakul.test",
    name: "Sekar Arum",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 16),
    phone: "081200000016",
    email: "penjual6@bakul.test",
    name: "Bagus Setiawan",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 17),
    phone: "081200000017",
    email: "penjual7@bakul.test",
    name: "Lestari Ningsih",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 18),
    phone: "081200000018",
    email: "penjual8@bakul.test",
    name: "Dian Puspita",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 21),
    phone: "081200000021",
    email: "pembeli@bakul.test",
    name: "Sri Wahyuni",
    role: UserRole.BUYER,
    isVerified: true,
  },
];

/* ------------------------------------------------------------------ */
/* Delapan toko, satu toko untuk satu kategori                        */
/* ------------------------------------------------------------------ */

const shops: SeedShop[] = [
  {
    id: seedId(2, 1),
    ownerUserId: seedId(1, 11),
    name: "Dapur Bu Sri",
    slug: "dapur-bu-sri",
    description:
      "Kue kering rumahan dari Sleman. Dipanggang per pesanan, tanpa pengawet.",
    cityId: "3404",
    cityName: "Sleman",
    bankName: "BCA",
    bankAccountNumber: "0000000001",
    bankAccountHolder: "Sri Rahayu",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 2),
    ownerUserId: seedId(1, 12),
    name: "Keripik Mbok Nah",
    slug: "keripik-mbok-nah",
    description: "Camilan gurih buatan sendiri dari Bantul, digoreng setiap pagi.",
    cityId: "3402",
    cityName: "Bantul",
    bankName: "BRI",
    bankAccountNumber: "0000000002",
    bankAccountHolder: "Nah Rowiyah",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 3),
    ownerUserId: seedId(1, 13),
    name: "Sembako Asep Jaya",
    slug: "sembako-asep-jaya",
    description: "Sembako sehari-hari dari Bandung. Harga warung, ditimbang pas.",
    cityId: "3273",
    cityName: "Bandung",
    bankName: "Mandiri",
    bankAccountNumber: "0000000003",
    bankAccountHolder: "Asep Hidayat",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 4),
    ownerUserId: seedId(1, 14),
    name: "Kopi Lereng Tangsi",
    slug: "kopi-lereng-tangsi",
    description: "Kopi dan minuman seduh dari lereng Bandung. Disangrai mingguan.",
    cityId: "3273",
    cityName: "Bandung",
    bankName: "Mandiri",
    bankAccountNumber: "0000000004",
    bankAccountHolder: "Yanto Wibowo",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 5),
    ownerUserId: seedId(1, 15),
    name: "Batik Sekar Arum",
    slug: "batik-sekar-arum",
    description: "Batik tulis dan tenun dari Solo, dikerjakan pembatik langganan.",
    cityId: "3372",
    cityName: "Solo",
    bankName: "BNI",
    bankAccountNumber: "0000000005",
    bankAccountHolder: "Sekar Arum",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 6),
    ownerUserId: seedId(1, 16),
    name: "Anyaman Nusantara",
    slug: "anyaman-nusantara",
    description: "Anyaman rotan dan bambu dari Surabaya, buatan pengrajin lokal.",
    cityId: "3578",
    cityName: "Surabaya",
    bankName: "BCA",
    bankAccountNumber: "0000000006",
    bankAccountHolder: "Bagus Setiawan",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 7),
    ownerUserId: seedId(1, 17),
    name: "Rempah Ayu",
    slug: "rempah-ayu",
    description: "Sabun dan perawatan alami dari Yogyakarta, dibuat dari rempah pilihan.",
    cityId: "3404",
    cityName: "Sleman",
    bankName: "BRI",
    bankAccountNumber: "0000000007",
    bankAccountHolder: "Lestari Ningsih",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 8),
    ownerUserId: seedId(1, 18),
    name: "Rumah Tangga Sejahtera",
    slug: "rumah-tangga-sejahtera",
    description: "Perlengkapan rumah dari Semarang. Anyaman rapi, tahan lama.",
    cityId: "3374",
    cityName: "Semarang",
    bankName: "BCA",
    bankAccountNumber: "0000000008",
    bankAccountHolder: "Dian Puspita",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
];

const etalaseNames = [
  "Kue Lebaran",
  "Camilan",
  "Sembako",
  "Kopi & Teh",
  "Batik & Tenun",
  "Anyaman",
  "Perawatan",
  "Rumah Tangga",
];

const etalases: SeedEtalase[] = shops.map((shop, index) => ({
  id: seedId(8, index + 1),
  shopId: shop.id,
  name: etalaseNames[index] ?? "Semua Barang",
  slug: slugify(etalaseNames[index] ?? "Semua Barang"),
  sortOrder: 1,
}));

const categories: SeedCategory[] = [
  { id: seedId(6, 1), name: "Makanan Ringan", slug: "makanan-ringan", sortOrder: 1 },
  { id: seedId(6, 2), name: "Kue Kering", slug: "kue-kering", sortOrder: 2 },
  { id: seedId(6, 3), name: "Sembako", slug: "sembako", sortOrder: 3 },
  { id: seedId(6, 4), name: "Minuman", slug: "minuman", sortOrder: 4 },
  { id: seedId(6, 5), name: "Fashion", slug: "fashion", sortOrder: 5 },
  { id: seedId(6, 6), name: "Kerajinan", slug: "kerajinan", sortOrder: 6 },
  { id: seedId(6, 7), name: "Perawatan Diri", slug: "perawatan-diri", sortOrder: 7 },
  { id: seedId(6, 8), name: "Rumah Tangga", slug: "rumah-tangga", sortOrder: 8 },
];

/* ------------------------------------------------------------------ */
/* Alamat pembeli                                                     */
/* ------------------------------------------------------------------ */

const addressAreas = [
  {
    provinceId: "34",
    cityId: "3404",
    districtId: "340401",
    postalCode: "55581",
    cityName: "Sleman",
    street: "Jl. Kaliurang KM 5, Condongcatur",
  },
  {
    provinceId: "32",
    cityId: "3273",
    districtId: "327301",
    postalCode: "40111",
    cityName: "Bandung",
    street: "Jl. Sukajadi No. 12",
  },
];

const buyer = users.find((user) => user.role === UserRole.BUYER);
if (!buyer) {
  throw new Error("Pengguna pembeli tidak ditemukan.");
}

const addresses: SeedAddress[] = addressAreas.map((area, index) => ({
  id: seedId(5, index + 1),
  userId: buyer.id,
  label: index === 0 ? "Rumah" : "Kantor",
  recipientName: buyer.name,
  phone: buyer.phone,
  provinceId: area.provinceId,
  cityId: area.cityId,
  districtId: area.districtId,
  postalCode: area.postalCode,
  fullAddress: `${area.street} No. ${10 + index}, ${area.cityName}`,
  isDefault: index === 0,
}));

/* ------------------------------------------------------------------ */
/* Katalog: 4 produk per toko, foto sendiri-sendiri                   */
/* ------------------------------------------------------------------ */

type CatalogItem = {
  name: string;
  photoKey: string;
  price: number;
  weightGram: number;
  description: string;
  /** [label, pengali harga] */
  variants: Array<[string, number]>;
};

type CatalogShop = {
  categorySlug: string;
  items: CatalogItem[];
};

const catalogByShop: CatalogShop[] = [
  {
    categorySlug: "kue-kering",
    items: [
      {
        name: "Nastar Premium",
        photoKey: "nastar",
        price: 42_000,
        weightGram: 250,
        description:
          "Nastar isi selai nanas asli, dipanggang sampai renyah di luar dan lembut di dalam. Dikemas toples rapat.",
        variants: [
          ["250 g", 1],
          ["500 g", 1.9],
          ["1 kg", 3.6],
        ],
      },
      {
        name: "Kastengel Keju",
        photoKey: "kastengel",
        price: 48_000,
        weightGram: 250,
        description:
          "Kastengel dengan keju Edam parut. Gurih, tipis, dan mudah dipatahkan.",
        variants: [
          ["250 g", 1],
          ["500 g", 1.9],
        ],
      },
      {
        name: "Putri Salju",
        photoKey: "putri-salju",
        price: 40_000,
        weightGram: 250,
        description:
          "Kue putri salju bertabur gula halus dengan kacang mede sangrai di dalamnya.",
        variants: [
          ["250 g", 1],
          ["500 g", 1.9],
        ],
      },
      {
        name: "Lidah Kucing Keju",
        photoKey: "lidah-kucing",
        price: 38_000,
        weightGram: 200,
        description:
          "Lidah kucing tipis dan renyah dengan rasa keju yang ringan. Cocok untuk suguhan tamu.",
        variants: [
          ["200 g", 1],
          ["400 g", 1.9],
        ],
      },
    ],
  },
  {
    categorySlug: "makanan-ringan",
    items: [
      {
        name: "Keripik Singkong Balado",
        photoKey: "keripik-singkong",
        price: 18_000,
        weightGram: 150,
        description:
          "Singkong iris tipis dengan bumbu balado pedas manis. Digoreng harian, tanpa pengawet.",
        variants: [
          ["150 g", 1],
          ["300 g", 1.9],
        ],
      },
      {
        name: "Keripik Tempe",
        photoKey: "keripik-tempe",
        price: 22_000,
        weightGram: 150,
        description:
          "Tempe kedelai segar diiris tipis lalu digoreng garing. Gurih dan tidak berminyak.",
        variants: [
          ["150 g", 1],
          ["300 g", 1.9],
        ],
      },
      {
        name: "Kerupuk Udang",
        photoKey: "kerupuk-udang",
        price: 25_000,
        weightGram: 200,
        description:
          "Kerupuk udang asli dengan aroma udang yang kuat. Renyah setelah digoreng.",
        variants: [
          ["200 g", 1],
          ["500 g", 2.2],
        ],
      },
      {
        name: "Kacang Goreng Bawang",
        photoKey: "kacang-goreng",
        price: 20_000,
        weightGram: 200,
        description:
          "Kacang tanah digoreng dengan irisan bawang putih. Gurih, garing, dan harum.",
        variants: [
          ["200 g", 1],
          ["400 g", 1.9],
        ],
      },
    ],
  },
  {
    categorySlug: "sembako",
    items: [
      {
        name: "Beras Organik Putih",
        photoKey: "beras",
        price: 78_000,
        weightGram: 5_000,
        description:
          "Beras organik putih pulen. Cocok untuk masakan harian keluarga.",
        variants: [
          ["1 kg", 1],
          ["5 kg", 4.6],
        ],
      },
      {
        name: "Gula Aren",
        photoKey: "gula-aren",
        price: 32_000,
        weightGram: 500,
        description:
          "Gula aren cetak dari nira kelapa. Aroma kuat, cocok untuk jajanan dan kopi.",
        variants: [
          ["500 g", 1],
          ["1 kg", 1.9],
        ],
      },
      {
        name: "Minyak Kelapa",
        photoKey: "minyak-kelapa",
        price: 45_000,
        weightGram: 500,
        description:
          "Minyak kelapa murni tanpa campuran. Dipakai untuk memasak atau perawatan kulit.",
        variants: [
          ["250 ml", 1],
          ["500 ml", 1.8],
        ],
      },
      {
        name: "Telur Asin",
        photoKey: "telur-asin",
        price: 28_000,
        weightGram: 500,
        description:
          "Telur bebek asin dengan kuning berminyak. Diasinkan secara tradisional.",
        variants: [
          ["5 butir", 1],
          ["10 butir", 1.9],
        ],
      },
    ],
  },
  {
    categorySlug: "minuman",
    items: [
      {
        name: "Kopi Robusta Bubuk",
        photoKey: "kopi-robusta",
        price: 35_000,
        weightGram: 200,
        description:
          "Kopi robusta digiling halus, disangrai sedang. Pahit mantap dengan aroma kuat.",
        variants: [
          ["200 g", 1],
          ["500 g", 2.2],
        ],
      },
      {
        name: "Kopi Arabika Biji",
        photoKey: "kopi-arabika",
        price: 68_000,
        weightGram: 250,
        description:
          "Biji arabika utuh, disangrai mingguan. Manis alami dengan sedikit rasa buah.",
        variants: [
          ["250 g", 1],
          ["500 g", 1.9],
        ],
      },
      {
        name: "Teh Melati",
        photoKey: "teh-melati",
        price: 24_000,
        weightGram: 100,
        description:
          "Teh melati wangi dari pucuk daun pilihan. Seduh hangat atau dingin.",
        variants: [
          ["100 g", 1],
          ["250 g", 2.2],
        ],
      },
      {
        name: "Sirup Markisa",
        photoKey: "sirup-markisa",
        price: 38_000,
        weightGram: 500,
        description:
          "Sirup markisa asli tanpa pewarna. Cukup dua sendok untuk satu gelas.",
        variants: [
          ["500 ml", 1],
          ["1 liter", 1.8],
        ],
      },
    ],
  },
  {
    categorySlug: "fashion",
    items: [
      {
        name: "Kemeja Batik Tiga Negeri",
        photoKey: "kemeja-batik",
        price: 185_000,
        weightGram: 350,
        description:
          "Kemeja batik lengan panjang dengan motif tiga negeri. Bahan katun adem.",
        variants: [
          ["S", 1],
          ["M", 1],
          ["L", 1.05],
          ["XL", 1.1],
        ],
      },
      {
        name: "Kebaya Nusantara",
        photoKey: "kebaya",
        price: 245_000,
        weightGram: 400,
        description:
          "Kebaya dengan bordir halus dan kain batik. Cocok untuk acara keluarga.",
        variants: [
          ["S", 1],
          ["M", 1],
          ["L", 1.05],
        ],
      },
      {
        name: "Selendang Batik",
        photoKey: "selendang-batik",
        price: 95_000,
        weightGram: 150,
        description:
          "Selendang batik cap dengan warna tanah. Ringan dan mudah dililitkan.",
        variants: [
          ["Standar", 1],
        ],
      },
      {
        name: "Kain Tenun Ikat",
        photoKey: "tenun-ikat",
        price: 320_000,
        weightGram: 500,
        description:
          "Kain tenun ikat tenun tangan. Motif dan warnanya khas, satu lembar satu motif.",
        variants: [
          ["2 meter", 1],
          ["3 meter", 1.4],
        ],
      },
    ],
  },
  {
    categorySlug: "kerajinan",
    items: [
      {
        name: "Tas Anyaman Pandan",
        photoKey: "tas-pandan",
        price: 65_000,
        weightGram: 300,
        description:
          "Tas anyaman pandan dengan tali jalin. Ringan, kuat, dan wangi alami.",
        variants: [
          ["Kecil", 1],
          ["Sedang", 1.3],
        ],
      },
      {
        name: "Bakul Rotan",
        photoKey: "bakul-rotan",
        price: 120_000,
        weightGram: 800,
        description:
          "Bakul rotan anyaman rapat dengan pegangan. Cocok untuk belanja pasar atau hiasan.",
        variants: [
          ["Sedang", 1],
          ["Besar", 1.4],
        ],
      },
      {
        name: "Keranjang Bambu",
        photoKey: "keranjang-bambu",
        price: 85_000,
        weightGram: 600,
        description:
          "Keranjang bambu serbaguna untuk menyimpan buah, cucian, atau mainan.",
        variants: [
          ["Kecil", 1],
          ["Sedang", 1.25],
          ["Besar", 1.6],
        ],
      },
      {
        name: "Hiasan Dinding Anyaman",
        photoKey: "hiasan-bambu",
        price: 78_000,
        weightGram: 400,
        description:
          "Panel anyaman bambu bermotif geometris. Digantung di ruang tamu atau kamar.",
        variants: [
          ["Standar", 1],
        ],
      },
    ],
  },
  {
    categorySlug: "perawatan-diri",
    items: [
      {
        name: "Sabun Herbal",
        photoKey: "sabun-herbal",
        price: 18_000,
        weightGram: 100,
        description:
          "Sabun padat dari minyak kelapa dan rempah. Tanpa pewarna buatan.",
        variants: [
          ["1 buah", 1],
          ["3 buah", 2.6],
        ],
      },
      {
        name: "Lulur Kopi",
        photoKey: "lulur-kopi",
        price: 42_000,
        weightGram: 250,
        description:
          "Lulur dari ampas kopi dan gula. Mengangkat sel kulit mati, wangi kopi lembut.",
        variants: [
          ["250 g", 1],
          ["500 g", 1.9],
        ],
      },
      {
        name: "Minyak Kelapa Wangi",
        photoKey: "minyak-kelapa-wangi",
        price: 35_000,
        weightGram: 200,
        description:
          "Minyak kelapa murni untuk pelembap kulit dan rambut. Wangi sereh.",
        variants: [
          ["100 ml", 1],
          ["200 ml", 1.8],
        ],
      },
      {
        name: "Sikat Gigi Bambu",
        photoKey: "sikat-bambu",
        price: 15_000,
        weightGram: 50,
        description:
          "Sikat gigi berbulu halus dengan gagang bambu. Bisa dipakai ulang.",
        variants: [
          ["1 buah", 1],
          ["3 buah", 2.6],
        ],
      },
    ],
  },
  {
    categorySlug: "rumah-tangga",
    items: [
      {
        name: "Tikar Pandan",
        photoKey: "tikar-pandan",
        price: 85_000,
        weightGram: 1_200,
        description:
          "Tikar pandan anyaman rapat. Adem dipakai di lantai atau untuk duduk santai.",
        variants: [
          ["120 x 180 cm", 1],
          ["150 x 200 cm", 1.4],
        ],
      },
      {
        name: "Keset Sabut",
        photoKey: "keset",
        price: 45_000,
        weightGram: 800,
        description:
          "Keset dari sabut kelapa yang menyerap air dan kotoran dengan baik.",
        variants: [
          ["40 x 60 cm", 1],
          ["50 x 80 cm", 1.4],
        ],
      },
      {
        name: "Tempat Tisu",
        photoKey: "tempat-tisu",
        price: 38_000,
        weightGram: 300,
        description:
          "Tempat tisu dari bahan alami. Rapi di meja tamu, mudah dibersihkan.",
        variants: [
          ["Standar", 1],
        ],
      },
      {
        name: "Kap Lampu Bambu",
        photoKey: "kap-lampu",
        price: 95_000,
        weightGram: 400,
        description:
          "Kap lampu anyaman bambu. Cahaya yang keluar hangat dengan bayangan berpola.",
        variants: [
          ["Kecil", 1],
          ["Besar", 1.4],
        ],
      },
    ],
  },
];

const products: SeedProduct[] = [];
const variants: SeedVariant[] = [];

let globalIndex = 0;

for (let shopIndex = 0; shopIndex < shops.length; shopIndex += 1) {
  const shop = shops[shopIndex];
  const catalog = catalogByShop[shopIndex];
  const etalase = etalases[shopIndex];
  if (!shop || !catalog || !etalase) {
    throw new Error("Katalog seed tidak lengkap.");
  }

  const category = categories.find((item) => item.slug === catalog.categorySlug);
  if (!category) {
    throw new Error(`Kategori ${catalog.categorySlug} tidak ditemukan.`);
  }

  for (const [itemIndex, item] of catalog.items.entries()) {
    globalIndex += 1;
    const productId = seedId(3, globalIndex);

    products.push({
      id: productId,
      shopId: shop.id,
      categoryId: category.id,
      etalaseId: etalase.id,
      photoKey: item.photoKey,
      name: item.name,
      slug: `${slugify(item.name)}-${globalIndex.toString().padStart(3, "0")}`,
      description: `${item.description} Dikirim dari ${shop.name}, ${shop.cityName}.`,
      weightGram: item.weightGram,
      status: ProductStatus.ACTIVE,
      avgRating: 4.5,
      soldCount: 0,
    });

    for (const [variantIndex, [label, multiplier]] of item.variants.entries()) {
      variants.push({
        id: seedId(4, globalIndex * 10 + variantIndex + 1),
        productId,
        sku: `BKL-S${shopIndex + 1}-${globalIndex.toString().padStart(3, "0")}-${
          variantIndex + 1
        }`,
        name: label,
        price: Math.round((item.price * multiplier) / 500) * 500,
        stockAvailable:
          itemIndex === 0 ? 6 + ((globalIndex * 7) % 18) : 18 + ((globalIndex * 13) % 60),
        stockReserved: 0,
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Ulasan contoh (bukan transaksi)                                    */
/* ------------------------------------------------------------------ */

const reviewComments = [
  "Barangnya sesuai foto dan dikemas rapi.",
  "Kualitasnya bagus untuk harga segini.",
  "Packing aman, tidak ada yang rusak.",
  "Cocok untuk oleh-oleh keluarga.",
  "Penjualnya ramah dan cepat membalas.",
];

/* ------------------------------------------------------------------ */
/* Foto: JPEG -> WebP <= 32 KB                                        */
/* ------------------------------------------------------------------ */

const seedPhotoDefs = [
  { key: "nastar", source: "katalog-nastar.jpg" },
  { key: "kastengel", source: "katalog-kastengel.jpg" },
  { key: "putri-salju", source: "katalog-putri-salju.jpg" },
  { key: "lidah-kucing", source: "katalog-lidah-kucing.jpg" },
  { key: "keripik-singkong", source: "katalog-keripik-singkong.jpg" },
  { key: "keripik-tempe", source: "katalog-keripik-tempe.jpg" },
  { key: "kerupuk-udang", source: "katalog-kerupuk-udang.jpg" },
  { key: "kacang-goreng", source: "katalog-kacang-goreng.jpg" },
  { key: "beras", source: "katalog-beras.jpg" },
  { key: "gula-aren", source: "katalog-gula-aren.jpg" },
  { key: "minyak-kelapa", source: "katalog-minyak-kelapa.jpg" },
  { key: "telur-asin", source: "katalog-telur-asin.jpg" },
  { key: "kopi-robusta", source: "katalog-kopi-robusta.jpg" },
  { key: "kopi-arabika", source: "katalog-kopi-arabika.jpg" },
  { key: "teh-melati", source: "katalog-teh-melati.jpg" },
  { key: "sirup-markisa", source: "katalog-sirup-markisa.jpg" },
  { key: "kemeja-batik", source: "katalog-kemeja-batik.jpg" },
  { key: "kebaya", source: "katalog-kebaya.jpg" },
  { key: "selendang-batik", source: "katalog-selendang-batik.jpg" },
  { key: "tenun-ikat", source: "katalog-tenun-ikat.jpg" },
  { key: "tas-pandan", source: "katalog-tas-pandan.jpg" },
  { key: "bakul-rotan", source: "katalog-bakul-rotan.jpg" },
  { key: "keranjang-bambu", source: "katalog-keranjang-bambu.jpg" },
  { key: "hiasan-bambu", source: "katalog-hiasan-bambu.jpg" },
  { key: "sabun-herbal", source: "katalog-sabun-herbal.jpg" },
  { key: "lulur-kopi", source: "katalog-lulur-kopi.jpg" },
  { key: "minyak-kelapa-wangi", source: "katalog-minyak-kelapa-wangi.jpg" },
  { key: "sikat-bambu", source: "katalog-sikat-bambu.jpg" },
  { key: "tikar-pandan", source: "katalog-tikar-pandan.jpg" },
  { key: "keset", source: "katalog-keset.jpg" },
  { key: "tempat-tisu", source: "katalog-tempat-tisu.jpg" },
  { key: "kap-lampu", source: "katalog-kap-lampu.jpg" },
];

async function prepareSeedPhotos(): Promise<Record<string, string>> {
  const directory = productPhotoDir();
  await mkdir(directory, { recursive: true });
  const urls: Record<string, string> = {};

  for (const def of seedPhotoDefs) {
    const source = path.resolve(process.cwd(), "../../docs/desain/gambar", def.source);
    const filename = `seed-${def.key}.webp`;
    let output: Buffer | null = null;

    for (const width of [900, 700, 500, 400, 320]) {
      for (const quality of [76, 66, 56, 46, 38]) {
        const candidate = await sharp(source)
          .rotate()
          .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();

        output = candidate;
        if (candidate.length <= PHOTO_BUDGET_BYTES) {
          break;
        }
      }

      if (output && output.length <= PHOTO_BUDGET_BYTES) {
        break;
      }
    }

    if (!output) {
      throw new Error(`Gagal membuat foto seed ${filename}.`);
    }

    await writeFile(path.join(directory, filename), output);
    urls[def.key] = `/api/v1/files/products/${filename}`;
  }

  return urls;
}

/* ------------------------------------------------------------------ */
/* Jalankan seed                                                      */
/* ------------------------------------------------------------------ */

async function clearTransactions(): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE TABLE
      "webhook_events",
      "ledger_entries",
      "ledger_journals",
      "withdrawals",
      "shop_wallets",
      "dispute_messages",
      "disputes",
      "shipments",
      "order_items",
      "order_invoices",
      "payments",
      "cart_items",
      "carts"
    CASCADE
  `;
  await prisma.notification.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.appSetting.deleteMany({
    where: { key: { in: ["demo_epoch", "demo_started_at"] } },
  });
}

async function removeObsoleteRows(): Promise<void> {
  // Seed lama punya 5 toko dan 100 produk. Setelah struktur berubah menjadi
  // 8 toko x 4 produk, sisa baris lama dibersihkan agar katalog tidak ganda.
  const productIds = new Set(products.map((product) => product.id));
  const shopIds = new Set(shops.map((shop) => shop.id));
  const userIds = new Set(users.map((user) => user.id));
  const etalaseIds = new Set(etalases.map((etalase) => etalase.id));
  const addressIds = new Set(addresses.map((address) => address.id));

  await prisma.review.deleteMany({ where: { productId: { notIn: [...productIds] } } });
  await prisma.productImage.deleteMany({ where: { productId: { notIn: [...productIds] } } });
  await prisma.productVariant.deleteMany({ where: { productId: { notIn: [...productIds] } } });
  await prisma.product.deleteMany({ where: { id: { notIn: [...productIds] } } });
  await prisma.shopEtalase.deleteMany({ where: { id: { notIn: [...etalaseIds] } } });
  await prisma.shop.deleteMany({ where: { id: { notIn: [...shopIds] } } });
  await prisma.userAddress.deleteMany({ where: { id: { notIn: [...addressIds] } } });
  await prisma.user.deleteMany({ where: { id: { notIn: [...userIds] } } });
}

async function seed(): Promise<void> {
  await clearTransactions();
  const seedImageUrls = await prepareSeedPhotos();

  for (const user of users) {
    const { id, ...data } = user;
    await prisma.user.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const category of categories) {
    const { id, ...data } = category;
    await prisma.category.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const shop of shops) {
    const { id, ...data } = shop;
    await prisma.shop.upsert({
      where: { id },
      update: { ...data, status: ShopStatus.ACTIVE },
      create: { id, ...data, status: ShopStatus.ACTIVE },
    });
  }

  for (const etalase of etalases) {
    const { id, ...data } = etalase;
    await prisma.shopEtalase.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const address of addresses) {
    const { id, ...data } = address;
    await prisma.userAddress.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const product of products) {
    const { id, photoKey: _photoKey, ...data } = product;
    await prisma.product.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const variant of variants) {
    const { id, ...data } = variant;
    await prisma.productVariant.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const [index, product] of products.entries()) {
    const url = seedImageUrls[product.photoKey];
    if (!url) {
      throw new Error(`Foto untuk ${product.photoKey} tidak tersedia.`);
    }

    const imageId = seedId(7, index + 1);
    await prisma.productImage.upsert({
      where: { id: imageId },
      update: { productId: product.id, url, position: 0 },
      create: { id: imageId, productId: product.id, url, position: 0 },
    });
  }

  for (const [index, product] of products.entries()) {
    for (let reviewIndex = 0; reviewIndex < 2; reviewIndex += 1) {
      const reviewId = seedId(9, index * 2 + reviewIndex + 1);
      const rating = reviewIndex === 0 ? 5 : 4;
      const comment = reviewComments[(index + reviewIndex) % reviewComments.length] ?? null;
      await prisma.review.upsert({
        where: { id: reviewId },
        update: { productId: product.id, buyerId: buyer.id, rating, comment },
        create: {
          id: reviewId,
          productId: product.id,
          buyerId: buyer.id,
          rating,
          comment,
        },
      });
    }
  }

  await removeObsoleteRows();

  const [
    userCount,
    shopCount,
    categoryCount,
    productCount,
    addressCount,
    variantCount,
    etalaseCount,
    imageCount,
    reviewCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.userAddress.count(),
    prisma.productVariant.count(),
    prisma.shopEtalase.count(),
    prisma.productImage.count(),
    prisma.review.count(),
  ]);

  const [orderCount, ledgerCount] = await Promise.all([
    prisma.orderInvoice.count(),
    prisma.ledgerJournal.count(),
  ]);

  console.log(
    `Seed selesai: ${userCount} pengguna (1 admin, ${shopCount} penjual, 1 pembeli), ` +
      `${shopCount} toko, ${categoryCount} kategori, ${productCount} produk, ` +
      `${variantCount} pilihan, ${addressCount} alamat, ${etalaseCount} etalase, ` +
      `${imageCount} foto, ${reviewCount} ulasan.`,
  );
  console.log(
    `Transaksi: ${orderCount} pesanan, ${ledgerCount} jurnal. Riwayat transaksi memang kosong.`,
  );

  if (
    userCount !== 10 ||
    shopCount !== 8 ||
    categoryCount !== 8 ||
    productCount !== 32 ||
    etalaseCount !== 8 ||
    imageCount !== 32 ||
    reviewCount !== 64 ||
    orderCount !== 0 ||
    ledgerCount !== 0
  ) {
    throw new Error("Jumlah data seed tidak sesuai target M9.");
  }
}

seed()
  .catch((error: unknown) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
