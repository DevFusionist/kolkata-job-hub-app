"use client";

import React, { createContext, useContext, useState } from "react";

interface AuthBackContextValue {
  canGoBack: boolean;
  setCanGoBack: (v: boolean) => void;
}

const AuthBackContext = createContext<AuthBackContextValue | null>(null);

export function AuthBackProvider({ children }: { children: React.ReactNode }) {
  const [canGoBack, setCanGoBack] = useState(false);
  const value: AuthBackContextValue = { canGoBack, setCanGoBack };
  return (
    <AuthBackContext.Provider value={value}>{children}</AuthBackContext.Provider>
  );
}

export function useAuthBack() {
  const ctx = useContext(AuthBackContext);
  if (!ctx) throw new Error("useAuthBack must be used within AuthBackProvider");
  return ctx;
}
