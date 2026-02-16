"use client";

import { createContext, useContext, useRef, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "anan_anonymous_user_id";

const AnonymousUserIdContext = createContext<(() => string) | null>(null);

function getOrCreateId(): string {
  if (typeof window === "undefined") {
    return `anon-${crypto.randomUUID()}`;
  }
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored;
  }
  const id = `anon-${crypto.randomUUID()}`;
  sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function AnonymousUserIdProvider({ children }: { children: ReactNode }) {
  const idRef = useRef<string | null>(null);
  const getAnonymousUserId = useCallback(() => {
    if (!idRef.current) {
      idRef.current = getOrCreateId();
    }
    return idRef.current;
  }, []);

  return (
    <AnonymousUserIdContext.Provider value={getAnonymousUserId}>
      {children}
    </AnonymousUserIdContext.Provider>
  );
}

export function useAnonymousUserId(): string {
  const context = useContext(AnonymousUserIdContext);
  if (!context) {
    throw new Error("useAnonymousUserId must be used within AnonymousUserIdProvider");
  }
  return context();
}
