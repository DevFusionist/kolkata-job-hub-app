import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../_contexts/AuthContext";
import { paymentService } from "../_services/paymentService";
import type { Entitlements } from "../_types";

export function useBilling() {
  const { user, updateUser } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await paymentService.getEntitlements();
      if (mountedRef.current) setEntitlements(data);
      return data;
    } catch {
      if (mountedRef.current) setEntitlements(null);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await load();
    if (data && user) {
      updateUser({
        ...user,
        freeJobsRemaining: data.jobCreditsRemaining ?? user.freeJobsRemaining,
        canUseAi: data.canUseAi ?? user.canUseAi,
      });
    }
    return data;
  }, [load, user, updateUser]);

  return { entitlements, loading, refresh };
}
