"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { CartView, NotificationItem } from "@bakul/shared";
import { BADGES_EVENT } from "@/lib/badges";
import { useAuth } from "@/lib/auth";

type AppBadgesValue = {
  cartCount: number;
  unreadCount: number;
};

const AppBadgesContext = createContext<AppBadgesValue>({
  cartCount: 0,
  unreadCount: 0,
});

/**
 * Badge bersama untuk header dan navigasi bawah. Satu permintaan saja supaya
 * jumlah keranjang dan inbox sama di dua tempat.
 */
export function AppBadgesProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, request } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeVersion, setBadgeVersion] = useState(0);

  const refresh = useCallback(() => {
    setBadgeVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    function onBadges(): void {
      refresh();
    }

    window.addEventListener(BADGES_EVENT, onBadges);
    return () => window.removeEventListener(BADGES_EVENT, onBadges);
  }, [refresh]);

  useEffect(() => {
    if (status !== "masuk") {
      setCartCount(0);
      setUnreadCount(0);
      return;
    }

    let alive = true;

    void Promise.all([
      request<CartView>("/api/v1/cart"),
      request<NotificationItem[]>("/api/v1/notifications"),
    ])
      .then(([cart, notifications]) => {
        if (!alive) {
          return;
        }
        setCartCount(cart.totalItems);
        setUnreadCount(notifications.filter((item) => !item.isRead).length);
      })
      .catch(() => {
        // Badge tidak boleh menghalangi halaman utama.
      });

    return () => {
      alive = false;
    };
  }, [status, request, pathname, badgeVersion]);

  const value = useMemo(() => ({ cartCount, unreadCount }), [cartCount, unreadCount]);

  return <AppBadgesContext.Provider value={value}>{children}</AppBadgesContext.Provider>;
}

export function useAppBadges(): AppBadgesValue {
  return useContext(AppBadgesContext);
}
