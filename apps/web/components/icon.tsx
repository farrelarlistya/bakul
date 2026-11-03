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
  | "arrowRight";

const PATHS: Record<IconName, string> = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 5 5",
  chat: "M21 11.5A8.5 8.5 0 0 1 8.5 20L3 21l1-5.5A8.5 8.5 0 1 1 21 11.5ZM8 10h8M8 14h5",
  bag: "M6 8h12l1 13H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
  home: "M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3V10.5Z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9c0-4 3-6 8-6s8 2 8 6",
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
  arrowRight: "M4 12h16M13 5l7 7-7 7",
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
