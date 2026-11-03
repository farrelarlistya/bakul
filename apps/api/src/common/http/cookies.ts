import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";

export const REFRESH_COOKIE = "bakul_refresh";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";
export const SESSION_MARKER_COOKIE = "bakul_has_session";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return undefined;
}

export function setRefreshCookie(response: Response, token: string, maxAgeMs: number): void {
  response.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  });
  response.cookie(SESSION_MARKER_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: maxAgeMs,
  });
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: REFRESH_COOKIE_PATH,
  });
  response.clearCookie(SESSION_MARKER_COOKIE, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
  });
}
