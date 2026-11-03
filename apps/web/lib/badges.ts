export const BADGES_EVENT = "bakul:badges";

export function refreshBadges(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BADGES_EVENT));
  }
}
