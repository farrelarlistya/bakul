import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ProductStatus, ShopStatus, UserRole } from "../src/generated/prisma/enums";

config({ path: "../../.env" });
config();

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error(
    "DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi kredensial PostgreSQL.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

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
    id: seedId(1, 2),
    phone: "081200000002",
    email: "operator@bakul.test",
    name: "Operator Demo",
    role: UserRole.OPERATOR_DEMO,
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
    name: "Sekar Arum",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 15),
    phone: "081200000015",
    email: "penjual5@bakul.test",
    name: "Yanto Wibowo",
    role: UserRole.SELLER,
    isVerified: true,
  },
  {
    id: seedId(1, 21),
    phone: "081200000021",
    email: "pembeli1@bakul.test",
    name: "Sri Wahyuni",
    role: UserRole.BUYER,
    isVerified: true,
  },
  {
    id: seedId(1, 22),
    phone: "081200000022",
    email: "pembeli2@bakul.test",
    name: "Dian Puspita",
    role: UserRole.BUYER,
    isVerified: true,
  },
  {
    id: seedId(1, 23),
    phone: "081200000023",
    email: "pembeli3@bakul.test",
    name: "Rizky Pratama",
    role: UserRole.BUYER,
    isVerified: true,
  },
  {
    id: seedId(1, 24),
    phone: "081200000024",
    email: "pembeli4@bakul.test",
    name: "Lestari Ningsih",
    role: UserRole.BUYER,
    isVerified: true,
  },
  {
    id: seedId(1, 25),
    phone: "081200000025",
    email: "pembeli5@bakul.test",
    name: "Bagus Setiawan",
    role: UserRole.BUYER,
    isVerified: true,
  },
];

const shops: SeedShop[] = [
  {
    id: seedId(2, 1),
    ownerUserId: seedId(1, 11),
    name: "Dapur Bu Sri",
    slug: "dapur-bu-sri",
    description: "Kue kering, lauk kering, dan sembako rumahan dari Sleman.",
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
    description: "Keripik dan camilan gurih buatan sendiri dari Bantul.",
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
    name: "Kopi Lereng Tangsi",
    slug: "kopi-lereng-tangsi",
    description: "Kopi dan minuman seduh dari lereng Bandung.",
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
    name: "Batik Sekar Arum",
    slug: "batik-sekar-arum",
    description: "Batik tulis dan kain tenun dari Solo.",
    cityId: "3372",
    cityName: "Solo",
    bankName: "BNI",
    bankAccountNumber: "0000000004",
    bankAccountHolder: "Sekar Arum",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
  {
    id: seedId(2, 5),
    ownerUserId: seedId(1, 15),
    name: "Rumah Anyam Nusantara",
    slug: "rumah-anyam-nusantara",
    description: "Anyaman, perlengkapan rumah, dan perawatan alami dari Surabaya.",
    cityId: "3578",
    cityName: "Surabaya",
    bankName: "BCA",
    bankAccountNumber: "0000000005",
    bankAccountHolder: "Yanto Wibowo",
    supportedCouriers: ["JNE", "SICEPAT"],
  },
];

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

const buyers = [
  { id: seedId(1, 21), name: "Sri Wahyuni", phone: "081200000021", cityIndex: 0 },
  { id: seedId(1, 22), name: "Dian Puspita", phone: "081200000022", cityIndex: 1 },
  { id: seedId(1, 23), name: "Rizky Pratama", phone: "081200000023", cityIndex: 2 },
  { id: seedId(1, 24), name: "Lestari Ningsih", phone: "081200000024", cityIndex: 3 },
  { id: seedId(1, 25), name: "Bagus Setiawan", phone: "081200000025", cityIndex: 4 },
];

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
    provinceId: "34",
    cityId: "3402",
    districtId: "340201",
    postalCode: "55711",
    cityName: "Bantul",
    street: "Jl. Parangtritis KM 7, Sewon",
  },
  {
    provinceId: "32",
    cityId: "3273",
    districtId: "327301",
    postalCode: "40111",
    cityName: "Bandung",
    street: "Jl. Sukajadi No. 12",
  },
  {
    provinceId: "33",
    cityId: "3372",
    districtId: "337201",
    postalCode: "57111",
    cityName: "Solo",
    street: "Jl. Slamet Riyadi No. 88",
  },
  {
    provinceId: "35",
    cityId: "3578",
    districtId: "357801",
    postalCode: "60111",
    cityName: "Surabaya",
    street: "Jl. Darmo No. 45",
  },
];

const addresses: SeedAddress[] = buyers.flatMap((buyer, buyerIndex) => {
  const area = addressAreas[buyerIndex];
  if (!area) {
    throw new Error("Data kota alamat tidak lengkap.");
  }

  return [
    {
      id: seedId(5, buyerIndex * 2 + 1),
      userId: buyer.id,
      label: "Rumah",
      recipientName: buyer.name,
      phone: buyer.phone,
      provinceId: area.provinceId,
      cityId: area.cityId,
      districtId: area.districtId,
      postalCode: area.postalCode,
      fullAddress: `${area.street} No. ${10 + buyerIndex}, ${area.cityName}`,
      isDefault: true,
    },
    {
      id: seedId(5, buyerIndex * 2 + 2),
      userId: buyer.id,
      label: "Kantor",
      recipientName: buyer.name,
      phone: buyer.phone,
      provinceId: area.provinceId,
      cityId: area.cityId,
      districtId: area.districtId,
      postalCode: area.postalCode,
      fullAddress: `${area.street} No. ${30 + buyerIndex}, ${area.cityName}`,
      isDefault: false,
    },
  ];
});

const catalogNames: string[][] = [
  [
    "Nastar Premium",
    "Kastengel Keju",
    "Putri Salju",
    "Lidah Kucing",
    "Semprit Susu",
    "Bolu Kukus Gula Jawa",
    "Brownies Kukus",
    "Keripik Pisang Manis",
    "Keripik Tempe Sagu",
    "Rempeyek Kacang",
    "Sambal Bawang Bu Sri",
    "Abon Ayam",
    "Beras Pandan Wangi 5 kg",
    "Gula Kelapa Aren",
    "Telur Asin Brebes",
    "Madu Hutan",
    "Tepung Tapioka",
    "Minyak Kelapa",
    "Bawang Goreng",
    "Kacang Sangrai",
  ],
  [
    "Keripik Singkong Balado",
    "Keripik Singkong Original",
    "Keripik Kentang Pedas",
    "Keripik Pisang Cokelat",
    "Keripik Tempe",
    "Keripik Talas",
    "Kerupuk Udang",
    "Kerupuk Ikan",
    "Basreng Pedas",
    "Cimol Kering",
    "Makaroni Pedas",
    "Kacang Atom",
    "Kacang Bawang",
    "Kacang Mete",
    "Rempeyek Teri",
    "Peyek Kacang",
    "Emping Melinjo",
    "Sagon Kelapa",
    "Grubi Ubi Ungu",
    "Wijen Kelapa",
  ],
  [
    "Kopi Robusta Lereng Tangsi",
    "Kopi Arabika Gayo",
    "Kopi Arabika Toraja",
    "Kopi Liberika",
    "Kopi Bubuk House Blend",
    "Kopi Instan Lokal",
    "Teh Melati",
    "Teh Hitam",
    "Teh Jahe Merah",
    "Wedang Uwuh",
    "Sirup Gula Aren",
    "Sirup Markisa",
    "Madu Kopi",
    "Cokelat Bubuk",
    "Susu Kambing Bubuk",
    "Gula Batu",
    "Kopi Luwak Simulasi",
    "Es Kopi Konsentrat",
    "Rempah Kopi",
    "Filter Bag Kopi",
  ],
  [
    "Batik Parang",
    "Batik Kawung",
    "Batik Sogan",
    "Batik Tulis Mega Mendung",
    "Kemeja Batik Pria",
    "Blus Batik Wanita",
    "Rok Batik",
    "Selendang Batik",
    "Kain Batik 2 m",
    "Tas Batik",
    "Dompet Batik",
    "Topi Batik",
    "Ikat Pinggang Batik",
    "Kain Tenun Lurik",
    "Selendang Tenun",
    "Sarung Tenun",
    "Kaus Sablon Lokal",
    "Totebag Kanvas",
    "Sepatu Kanvas Batik",
    "Masker Batik",
  ],
  [
    "Tas Anyaman Pandan",
    "Tas Anyaman Bambu",
    "Bakul Rotan",
    "Tempat Tisu Anyaman",
    "Topi Anyaman",
    "Tikar Pandan",
    "Keranjang Buah",
    "Vas Rotan",
    "Lampu Hias Bambu",
    "Nampan Anyaman",
    "Sabun Sereh",
    "Sabun Kopi",
    "Lulur Rempah",
    "Minyak Kelapa Wangi",
    "Lilin Aromaterapi",
    "Sikat Gigi Bambu",
    "Spons Cuci Anyaman",
    "Handuk Tenun",
    "Keset Pandan",
    "Hiasan Dinding Rotan",
  ],
];

const categoryByShopProduct: string[][] = [
  [
    "kue-kering",
    "kue-kering",
    "kue-kering",
    "kue-kering",
    "kue-kering",
    "kue-kering",
    "kue-kering",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "sembako",
    "sembako",
    "sembako",
    "sembako",
    "sembako",
    "sembako",
    "sembako",
    "makanan-ringan",
  ],
  [
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "sembako",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
    "makanan-ringan",
  ],
  [
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
    "sembako",
    "minuman",
    "minuman",
    "minuman",
    "minuman",
  ],
  [
    "fashion",
    "fashion",
    "fashion",
    "fashion",
    "fashion",
    "fashion",
    "fashion",
    "fashion",
    "fashion",
    "kerajinan",
    "kerajinan",
    "fashion",
    "fashion",
    "kerajinan",
    "kerajinan",
    "kerajinan",
    "fashion",
    "kerajinan",
    "fashion",
    "kerajinan",
  ],
  [
    "kerajinan",
    "kerajinan",
    "kerajinan",
    "kerajinan",
    "kerajinan",
    "rumah-tangga",
    "kerajinan",
    "kerajinan",
    "rumah-tangga",
    "kerajinan",
    "perawatan-diri",
    "perawatan-diri",
    "perawatan-diri",
    "perawatan-diri",
    "perawatan-diri",
    "perawatan-diri",
    "rumah-tangga",
    "rumah-tangga",
    "rumah-tangga",
    "kerajinan",
  ],
];

const basePriceByCategory: Record<string, number> = {
  "makanan-ringan": 18_000,
  "kue-kering": 42_000,
  sembako: 24_000,
  minuman: 28_000,
  fashion: 145_000,
  kerajinan: 55_000,
  "perawatan-diri": 26_000,
  "rumah-tangga": 38_000,
};

const priceStepByCategory: Record<string, number> = {
  "makanan-ringan": 3_000,
  "kue-kering": 5_000,
  sembako: 7_000,
  minuman: 4_000,
  fashion: 20_000,
  kerajinan: 9_000,
  "perawatan-diri": 4_000,
  "rumah-tangga": 6_000,
};

const weightByCategory: Record<string, number> = {
  "makanan-ringan": 200,
  "kue-kering": 250,
  sembako: 1_000,
  minuman: 200,
  fashion: 350,
  kerajinan: 500,
  "perawatan-diri": 250,
  "rumah-tangga": 600,
};

const variantsByCategory: Record<string, string[]> = {
  "makanan-ringan": ["100 g", "250 g", "500 g"],
  "kue-kering": ["250 g", "500 g", "1 kg"],
  sembako: ["500 g", "1 kg", "2 kg"],
  minuman: ["100 g", "250 g", "500 g"],
  fashion: ["S", "M", "L"],
  kerajinan: ["Kecil", "Sedang", "Besar"],
  "perawatan-diri": ["100 ml", "250 ml", "500 ml"],
  "rumah-tangga": ["Kecil", "Sedang", "Besar"],
};

const products: SeedProduct[] = [];
const variants: SeedVariant[] = [];

for (let shopIndex = 0; shopIndex < shops.length; shopIndex += 1) {
  const shop = shops[shopIndex];
  const names = catalogNames[shopIndex];
  const categorySlugs = categoryByShopProduct[shopIndex];
  if (!shop || !names || !categorySlugs) {
    throw new Error("Katalog seed tidak lengkap.");
  }

  for (let productIndex = 0; productIndex < names.length; productIndex += 1) {
    const globalIndex = shopIndex * 20 + productIndex + 1;
    const name = names[productIndex];
    const categorySlug = categorySlugs[productIndex];
    if (!name || !categorySlug) {
      throw new Error("Nama atau kategori produk seed tidak lengkap.");
    }

    const category = categories.find((item) => item.slug === categorySlug);
    if (!category) {
      throw new Error(`Kategori ${categorySlug} tidak ditemukan.`);
    }

    const basePrice = basePriceByCategory[categorySlug];
    const priceStep = priceStepByCategory[categorySlug];
    const weightGram = weightByCategory[categorySlug];
    if (basePrice === undefined || priceStep === undefined || weightGram === undefined) {
      throw new Error(`Tarif dasar ${categorySlug} tidak ditemukan.`);
    }

    const productId = seedId(3, globalIndex);
    const price = basePrice + (productIndex % 5) * priceStep + shopIndex * 500;

    products.push({
      id: productId,
      shopId: shop.id,
      categoryId: category.id,
      name,
      slug: `${slugify(name)}-${globalIndex.toString().padStart(3, "0")}`,
      description: `${name} buatan ${shop.name} di ${shop.cityName}. Dikirim langsung dari toko.`,
      weightGram,
      status: ProductStatus.ACTIVE,
      avgRating: Number((4.6 + ((productIndex * 3 + shopIndex) % 5) * 0.1).toFixed(2)),
      soldCount: 15 + ((productIndex * 17 + shopIndex * 11) % 240),
    });

    const variantLabels = variantsByCategory[categorySlug];
    if (!variantLabels) {
      throw new Error(`Varian ${categorySlug} tidak ditemukan.`);
    }

    const variantCount = 1 + ((productIndex + shopIndex) % 3);
    for (let variantIndex = 0; variantIndex < variantCount; variantIndex += 1) {
      const multiplier = [1, 1.8, 3.2][variantIndex] ?? 1;
      variants.push({
        id: seedId(4, globalIndex * 10 + variantIndex + 1),
        productId,
        sku: `BKL-S${shopIndex + 1}-${globalIndex.toString().padStart(3, "0")}-${
          variantIndex + 1
        }`,
        name: variantLabels[variantIndex] ?? "Standar",
        price: Math.round((price * multiplier) / 500) * 500,
        stockAvailable: 12 + ((productIndex * 7 + shopIndex * 13) % 90),
        stockReserved: 0,
      });
    }
  }
}

async function seed(): Promise<void> {
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

  for (const address of addresses) {
    const { id, ...data } = address;
    await prisma.userAddress.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const product of products) {
    const { id, ...data } = product;
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

  const [userCount, shopCount, categoryCount, productCount, addressCount, variantCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.userAddress.count(),
      prisma.productVariant.count(),
    ]);

  console.log(
    `Seed selesai: ${userCount} pengguna, ${shopCount} toko, ${categoryCount} kategori, ` +
      `${productCount} produk, ${variantCount} varian, ${addressCount} alamat.`,
  );

  if (productCount !== 100 || shopCount !== 5 || categoryCount !== 8) {
    throw new Error("Jumlah data seed tidak sesuai target M0.");
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
