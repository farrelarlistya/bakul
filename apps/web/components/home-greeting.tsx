"use client";

import { useAuth } from "@/lib/auth";

export function HomeGreeting({ className = "" }: { className?: string }) {
  const { status, user } = useAuth();
  const name =
    status === "masuk" && user ? user.name.split(" ")[0] : "Sobat Bakul";

  return <p className={className}>Halo, {name}</p>;
}
