import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../_contexts/AuthContext";
import api from "../_lib/api";
import type { Conversation } from "../_types";

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<Conversation[]>(`/messages/conversations/${user.id}`);
      if (mountedRef.current) setConversations(Array.isArray(data) ? data : []);
    } catch {
      if (mountedRef.current) setConversations([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { conversations, loading, refresh: load };
}
