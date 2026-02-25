"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../_types";

const USER_KEY = "user";
const TOKEN_KEY = "authToken";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  refreshFromStorage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const persist = async (user: User, token: string) => {
    await AsyncStorage.multiSet([
      [USER_KEY, JSON.stringify(user)],
      [TOKEN_KEY, token],
    ]);
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const login = async (user: User, token: string) => {
    await persist(user, token);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY]);
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const updateUser = async (user: User) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    setState((prev) => (prev.user ? { ...prev, user } : prev));
  };

  const refreshFromStorage = async () => {
    try {
      const [userJson, token] = await AsyncStorage.multiGet([USER_KEY, TOKEN_KEY]);
      const user = userJson[1] ? (JSON.parse(userJson[1]) as User) : null;
      const t = token[1];
      setState({
        user,
        token: t,
        isLoading: false,
        isAuthenticated: !!(user && t),
      });
    } catch {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [userJson, token] = await AsyncStorage.multiGet([USER_KEY, TOKEN_KEY]);
        if (cancelled) return;
        const user = userJson[1] ? (JSON.parse(userJson[1]) as User) : null;
        const t = token[1];
        setState({
          user,
          token: t,
          isLoading: false,
          isAuthenticated: !!(user && t),
        });
      } catch {
        if (cancelled) return;
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    updateUser,
    refreshFromStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
