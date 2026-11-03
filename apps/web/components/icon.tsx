export type IconName =
  | "search"
  | "chat"
  | "bag"
  | "home"
  | "receipt"
  | "user"
  | "shield"
  | "sliders"
  | "cake"
  | "coffee"
  | "shirt"
  | "basket"
  | "sparkles"
  | "star"
  | "store"
  | "chevronRight"
  | "arrowRight"
  | "chevronDown"
  | "chevronLeft"
  | "arrowLeft"
  | "check"
  | "close"
  | "info"
  | "warning"
  | "clock"
  | "wallet"
  | "truck"
  | "package"
  | "box"
  | "trash"
  | "edit"
  | "plus"
  | "minus"
  | "copy"
  | "download"
  | "upload"
  | "inbox"
  | "filter"
  | "refresh"
  | "image"
  | "phone"
  | "pin"
  | "card"
  | "calendar"
  | "bank"
  | "users"
  | "chart"
  | "lock"
  | "bell"
  | "camera"
  | "printer";

const PATHS: Record<IconName, string> = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 5 5",
  chat: "M21 11.5A8.5 8.5 0 0 1 8.5 20L3 21l1-5.5A8.5 8.5 0 1 1 21 11.5ZM8 10h8M8 14h5",
  bag: "M6 8h12l1 13H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
  home: "M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3V10.5Z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9c0-4 3-6 8-6s8 2 8 6",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8c0-4 3-6 6-6s6 2 6 6m1-9a3.5 3.5 0 1 0 0-7m1.5 8c2.5.6 4.5 2.5 4.5 5",
  shield: "M12 3l8 3v5c0 5-4 9-8 11-4-2-8-6-8-11V6l8-3Zm-3.5 9L11 14.5 16 9",
  sliders: "M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4",
  cake: "M4 20h16v-10H4v10Zm2-10V7c0-2 2-3 3-1 1 2 2-2 3-2s2 3 3 2c1-2 3-1 3 1v3M8 14h1M12 14h1M16 14h1",
  coffee: "M4 7h14v7c0 3-2 5-5 5H9c-3 0-5-2-5-5V7Zm14 2h2c2 0 2 5-2 5M7 3v2M11 3v2M15 3v2",
  shirt: "M8 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4-3c-1 2-7 2-8 0Z",
  basket: "M4 10h16l-2 10H6L4 10Zm4 0 2-6m6 6-2-6M8 14v3M12 14v3M16 14v3",
  sparkles: "M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Zm7 13 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z",
  star: "M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7l3-7Z",
  store: "M4 10 5 4h14l1 6M4 10v10h16V10M9 20v-6h6v6M4 10c0 2 2 3 4 2 2 1 3 1 4 0 1 1 3 1 4 0 2 1 4 0 4-2",
  chevronRight: "M9 5l7 7-7 7",
  chevronDown: "M5 9l7 7 7-7",
  chevronLeft: "M15 5l-7 7 7 7",
  arrowRight: "M4 12h16M13 5l7 7-7 7",
  arrowLeft: "M20 12H4m0 0 7-7m-7 7 7 7",
  check: "M20 6 9 17l-5-5",
  close: "M18 6 6 18M6 6l12 12",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13h.01M11 12h1v4h1",
  warning: "M12 4 2.5 20h19L12 4Zm0 6v4m0 3h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2",
  wallet: "M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-1-1V7Zm0 0V6a2 2 0 0 1 2-2h10v3m4 4h-4a2 2 0 0 0 0 4h4",
  truck: "M3 7h11v9H3V7Zm11 4h4l3 3v2h-7v-5ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  package: "M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 0v18M3 7.5 12 12l9-4.5M7.5 5.2l9 4.5",
  box: "M4 8h16v12H4V8Zm0 0 2.5-4h11L20 8M9 12h6",
  trash: "M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6",
  edit: "M4 20h4l10-10-4-4L4 16v4Zm10-14 4 4",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  copy: "M9 9h10v12H9V9ZM5 15H4V4h11v1",
  download: "M12 4v11m0 0 4-4m-4 4-4-4M4 19h16",
  upload: "M12 20V9m0 0 4 4m-4-4-4 4M4 5h16",
  inbox: "M4 13h4l1.5 3h5L16 13h4M4 13 6 5h12l2 8v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z",
  filter: "M4 5h16l-6 7v6l-4 2v-8L4 5Z",
  refresh: "M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4",
  image: "M4 5h16v14H4V5Zm0 10 4.5-4.5 4 4 3-3L20 15M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  phone: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 16h4",
  pin: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  card: "M3 7h18v12H3V7Zm0 4h18M7 15h4",
  calendar: "M4 6h16v15H4V6Zm0 5h16M8 3v4m8-4v4",
  bank: "M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M12 3l9 5H3l9-5Z",
  chart: "M4 20V10m5 10V4m5 16v-7m5 7V8",
  lock: "M6 11h12v9H6v-9Zm3 0V8a3 3 0 0 1 6 0v3",
  bell: "M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Zm4 8a2 2 0 0 0 4 0",
  camera: "M4 8h3l1.5-2h7L17 8h3v11H4V8Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  printer: "M7 9V4h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7v-7Z",
};

const FILLED: Partial<Record<IconName, boolean>> = {
  star: true,
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const filled = FILLED[name] ?? false;

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function categoryIcon(slug: string): IconName {
  const map: Record<string, IconName> = {
    "kue-kering": "cake",
    "makanan-ringan": "basket",
    sembako: "basket",
    minuman: "coffee",
    fashion: "shirt",
    kerajinan: "basket",
    "perawatan-diri": "sparkles",
    "rumah-tangga": "home",
  };

  return map[slug] ?? "basket";
}
