"use client";

import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WS_BASE = process.env.EXPO_PUBLIC_BACKEND_URL
  ? process.env.EXPO_PUBLIC_BACKEND_URL.replace(/^http/, "ws")
  : "ws://localhost:8000";

const RECONNECT_DELAY_MIN_MS = 1000;
const RECONNECT_DELAY_MAX_MS = 30000;
const PING_INTERVAL_MS = 25000;

type MessageHandler = (payload: unknown) => void;

interface SocketContextValue {
  send: (event: string, payload?: unknown) => void;
  on: (event: string, handler: MessageHandler) => () => void;
  isConnected: boolean;
  isReconnecting: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const mountedRef = useRef(true);

  const [isConnected, setConnected] = useState(false);
  const [isReconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const emit = (event: string, payload?: unknown) => {
    const handlers = listenersRef.current.get(event);
    if (handlers) {
      handlers.forEach((h) => h(payload));
    }
  };

  const clearPing = () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  const scheduleReconnect = (delayMs: number) => {
    if (reconnectTimeoutRef.current) return;
    if (mountedRef.current) setReconnecting(true);
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (mountedRef.current) connect();
    }, delayMs);
  };

  const getNextDelay = () => {
    const delay = RECONNECT_DELAY_MIN_MS * Math.pow(2, reconnectAttemptRef.current);
    return Math.min(delay, RECONNECT_DELAY_MAX_MS);
  };

  const connect = () => {
    if (!isAuthenticated || !user?.id || !token) return;

    intentionalCloseRef.current = false;
    const url = `${WS_BASE}/ws/${user.id}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      if (mountedRef.current) {
        setConnected(true);
        setReconnecting(false);
      }
      clearPing();
      pingTimerRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ event: "ping" }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onclose = () => {
      clearPing();
      wsRef.current = null;
      if (mountedRef.current) setConnected(false);
      if (intentionalCloseRef.current) {
        if (mountedRef.current) setReconnecting(false);
        return;
      }
      const delay = getNextDelay();
      reconnectAttemptRef.current += 1;
      scheduleReconnect(delay);
    };

    ws.onerror = () => {
      if (mountedRef.current) setConnected(false);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const event = data?.event ?? "message";
        if (event === "pong") return;
        emit(event, data?.payload ?? data);
      } catch {
        emit("message", { raw: e.data });
      }
    };
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !token) {
      intentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (mountedRef.current) setReconnecting(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearPing();
      if (mountedRef.current) setConnected(false);
      reconnectAttemptRef.current = 0;
      return;
    }

    connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearPing();
      if (mountedRef.current) {
        setConnected(false);
        setReconnecting(false);
      }
      reconnectAttemptRef.current = 0;
    };
  }, [isAuthenticated, user?.id, token]);

  const send = (event: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }));
    }
  };

  const on = (event: string, handler: MessageHandler) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);
    return () => {
      listenersRef.current.get(event)?.delete(handler);
    };
  };

  const value: SocketContextValue = {
    send,
    on,
    isConnected,
    isReconnecting,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
