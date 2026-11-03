"use client";

import { useAuth } from "@/lib/auth";

export function HomeGreeting() {
  const { status, user } = useAuth();
  const name =
    status === "masuk" && user ? user.name.split(" ")[0] : "Sobat Bakul";

  return (
    <h1
      id="sapaan"
      className="mt-1 font-display text-2xl font-bold leading-8 text-tinta"
    >
      Halo, {name}
    </h1>
  );
}
