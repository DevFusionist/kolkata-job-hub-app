import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
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

type MessageListener = (message: IncomingMessage) => void;

interface SocketContextType {
  isConnected: boolean;
  addMessageListener: (listener: MessageListener) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<MessageListener>>(new Set());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!user?.id || !API_URL) return;
    const wsUrl = `${getWsUrl(API_URL)}/ws/${user.id}`;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
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
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      connect();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    }
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, connect]);

  const addMessageListener = useCallback((listener: MessageListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, addMessageListener }}>
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
