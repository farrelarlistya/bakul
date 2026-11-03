"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, AuthUser } from "@bakul/shared";

type AuthStatus = "memuat" | "tamu" | "masuk";

type RequestFn = <T>(path: string, init?: RequestInit) => Promise<T>;

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  request: RequestFn;
  download: (path: string, filename: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const error =
    body && typeof body === "object" && "error" in body
      ? (body as { error?: { code?: string; message?: string; details?: unknown[] } }).error
      : undefined;

  return new ApiError(
    error?.message ?? "Ada yang belum beres. Coba lagi.",
    response.status,
    error?.code ?? "ERROR",
    error?.details ?? [],
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("memuat");
  const [user, setUser] = useState<AuthUser | null>(null);
  const tokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthUser | null> | null>(null);

  const refreshInternal = useCallback(async (): Promise<AuthUser | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const task = (async () => {
      try {
        const response = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
        });

        if (!response.ok) {
          tokenRef.current = null;
          setUser(null);
          setStatus("tamu");
          return null;
        }

        const session = (await response.json()) as AuthSession;
        tokenRef.current = session.accessToken;
        setUser(session.user);
        setStatus("masuk");
        return session.user;
      } catch {
        tokenRef.current = null;
        setUser(null);
        setStatus("tamu");
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = task;
    return task;
  }, []);

  useEffect(() => {
    const hasSession = document.cookie
      .split(";")
      .some((part) => part.trim() === "bakul_has_session=1");

    if (!hasSession) {
      setStatus("tamu");
      return;
    }

    void refreshInternal();
  }, [refreshInternal]);

  const login = useCallback((session: AuthSession) => {
    tokenRef.current = session.accessToken;
    setUser(session.user);
    setStatus("masuk");
  }, []);

  const logout = useCallback(async () => {
    const token = tokenRef.current;

    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } finally {
      tokenRef.current = null;
      setUser(null);
      setStatus("tamu");
    }
  }, []);

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const doFetch = (token: string | null) => {
        const headers = new Headers(init.headers);
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }

        return fetch(path, {
          ...init,
          headers,
          credentials: "same-origin",
        });
      };

      let response = await doFetch(tokenRef.current);

      if (response.status === 401) {
        const refreshed = await refreshInternal();
        if (refreshed) {
          response = await doFetch(tokenRef.current);
        }
      }

      if (!response.ok) {
        throw await toApiError(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
    [refreshInternal],
  );

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const next = await request<AuthUser>("/api/v1/me");
      setUser(next);
      setStatus("masuk");
      return next;
    } catch {
      return null;
    }
  }, [request]);

  const download = useCallback(
    async (path: string, filename: string): Promise<void> => {
      const doFetch = (token: string | null) =>
        fetch(path, {
          credentials: "same-origin",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

      let response = await doFetch(tokenRef.current);
      if (response.status === 401) {
        const refreshed = await refreshInternal();
        if (refreshed) {
          response = await doFetch(tokenRef.current);
        }
      }

      if (!response.ok) {
        throw await toApiError(response);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    [refreshInternal],
  );

  const value = useMemo(
    () => ({ status, user, login, logout, refreshUser, request, download }),
    [status, user, login, logout, refreshUser, request, download],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  }
  return context;
}
