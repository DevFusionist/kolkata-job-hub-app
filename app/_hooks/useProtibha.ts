import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../_contexts/AuthContext";
import { aiService } from "../_services/aiService";

export interface ProtibhaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useProtibha() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ProtibhaMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadHistory = useCallback(async () => {
    if (!user?.id) {
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      const history = await aiService.getChatHistory(user.id, 1);
      const mapped: ProtibhaMessage[] = history.map((h, i) => ({
        id: h.id || `h-${i}-${h.createdAt}`,
        role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: h.content,
      }));
      if (mountedRef.current) setMessages(mapped);
    } catch {
      if (mountedRef.current) setMessages([]);
    } finally {
      if (mountedRef.current) setLoadingHistory(false);
    }
  }, [user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const send = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim() || !user?.id) return false;
      const userMsg: ProtibhaMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);
      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        const { content: reply } = await aiService.chat(history, user.id);
        if (mountedRef.current) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: "assistant", content: reply },
          ]);
        }
        return true;
      } catch (e: unknown) {
        if (mountedRef.current) setError((e as Error)?.message ?? "Something went wrong");
        return false;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [user?.id, messages]
  );

  const clearHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      await aiService.clearChatHistory(user.id);
      if (mountedRef.current) {
        setMessages([]);
        setError(null);
      }
    } catch (e: unknown) {
      if (mountedRef.current) setError((e as Error)?.message ?? "Failed to clear");
    }
  }, [user?.id]);

  return { messages, loading, loadingHistory, error, send, loadHistory, clearHistory };
}
