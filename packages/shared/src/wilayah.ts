export type Wilayah = {
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  postalCode: string;
};

export const WILAYAH: Wilayah[] = [
  {
    provinceId: "34",
    provinceName: "DI Yogyakarta",
    cityId: "3404",
    cityName: "Sleman",
    districtId: "340401",
    districtName: "Depok",
    postalCode: "55581",
  },
  {
    provinceId: "34",
    provinceName: "DI Yogyakarta",
    cityId: "3402",
    cityName: "Bantul",
    districtId: "340201",
    districtName: "Sewon",
    postalCode: "55711",
  },
  {
    provinceId: "32",
    provinceName: "Jawa Barat",
    cityId: "3273",
    cityName: "Bandung",
    districtId: "327301",
    districtName: "Sukajadi",
    postalCode: "40111",
  },
  {
    provinceId: "33",
    provinceName: "Jawa Tengah",
    cityId: "3372",
    cityName: "Solo",
    districtId: "337201",
    districtName: "Laweyan",
    postalCode: "57111",
  },
  {
    provinceId: "35",
    provinceName: "Jawa Timur",
    cityId: "3578",
    cityName: "Surabaya",
    districtId: "357801",
    districtName: "Darmo",
    postalCode: "60111",
  },
];

export function findWilayah(cityId: string): Wilayah | undefined {
  return WILAYAH.find((item) => item.cityId === cityId);
}
