import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../_contexts/AuthContext";
import { useSocket } from "../_contexts/SocketContext";
import api from "../_lib/api";
import type { ChatMessage } from "../_types";

interface NewMessagePayload {
  id?: string;
  conversationId?: string;
  senderId?: string;
  content?: string;
  createdAt?: string;
}

export function useChat(conversationId: string | undefined, userId: string | undefined) {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!conversationId && !userId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    try {
      const endpoint = conversationId
        ? `/messages/conversations/${conversationId}/messages`
        : `/messages/direct/${user?.id}/${userId}`;
      const { data } = await api.get<ChatMessage[]>(endpoint);
      if (mountedRef.current) setMessages(Array.isArray(data) ? data : []);
    } catch {
      if (mountedRef.current) setMessages([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [conversationId, userId, user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = socket.on("new_message", (payload: unknown) => {
      if (!mountedRef.current) return;
      const p = payload as NewMessagePayload;
      if (!p?.content) return;
      const forThisConversation = conversationId
        ? p.conversationId === conversationId
        : p.senderId === userId;
      if (!forThisConversation) return;
      const newMsg: ChatMessage = {
        id: p.id ?? `ws-${Date.now()}`,
        senderId: p.senderId ?? "",
        content: p.content,
        createdAt: p.createdAt ?? new Date().toISOString(),
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });
    return unsub;
  }, [socket, conversationId, userId]);

  const send = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim() || !user?.id) return false;
      const temp: ChatMessage = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, temp]);
      try {
        await api.post("/messages", {
          conversationId: conversationId ?? undefined,
          recipientId: userId,
          content: content.trim(),
        });
        return true;
      } catch {
        if (mountedRef.current) setMessages((prev) => prev.filter((m) => m.id !== temp.id));
        return false;
      }
    },
    [conversationId, userId, user?.id]
  );

  return { messages, loading, send, refresh: load };
}
