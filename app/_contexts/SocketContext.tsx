import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const getWsUrl = (apiUrl: string): string => {
  if (!apiUrl) return '';
  const base = apiUrl.replace(/\/$/, '');
  if (base.startsWith('https://')) return base.replace('https://', 'wss://');
  return base.replace('http://', 'ws://');
};

export interface IncomingMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
  jobId?: string;
}

export interface ReadReceiptEvent {
  readBy: string;
}

type MessageListener = (message: IncomingMessage) => void;
type ReadReceiptListener = (event: ReadReceiptEvent) => void;

interface SocketContextType {
  isConnected: boolean;
  addMessageListener: (listener: MessageListener) => () => void;
  addReadReceiptListener: (listener: ReadReceiptListener) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const MIN_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<MessageListener>>(new Set());
  const readReceiptListenersRef = useRef<Set<ReadReceiptListener>>(new Set());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelayRef = useRef(MIN_RECONNECT_MS);
  const intentionalCloseRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      intentionalCloseRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (!user?.id || !API_URL) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    intentionalCloseRef.current = false;
    const token = await AsyncStorage.getItem('token');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const wsUrl = `${getWsUrl(API_URL)}/ws/${user.id}${tokenParam}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectDelayRef.current = MIN_RECONNECT_MS;
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'ping' }));
          } catch {
            // ignore
          }
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === 'new_message' && data.payload) {
          listenersRef.current.forEach((listener) => listener(data.payload));
        }
        if (data.type === 'messages_read' && data.payload) {
          readReceiptListenersRef.current.forEach((listener) => listener(data.payload));
        }
      } catch {
        // ignore non-JSON or invalid
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Only reconnect if close wasn't intentional (user didn't log out)
      if (!intentionalCloseRef.current && user?.id) {
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_MS);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      reconnectDelayRef.current = MIN_RECONNECT_MS;
      connect();
    } else {
      // User logged out - clean up and don't reconnect
      cleanup();
    }
    return cleanup;
  }, [user?.id, connect, cleanup]);

  const addMessageListener = useCallback((listener: MessageListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const addReadReceiptListener = useCallback((listener: ReadReceiptListener) => {
    readReceiptListenersRef.current.add(listener);
    return () => {
      readReceiptListenersRef.current.delete(listener);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, addMessageListener, addReadReceiptListener }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
