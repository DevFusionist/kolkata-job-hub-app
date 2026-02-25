import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../_contexts/AuthContext";
import { applicationService } from "../_services/applicationService";
import type { Application } from "../_types";

export function useApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setApplications([]);
      setLoading(false);
      return;
    }
    try {
      const list = await applicationService.getBySeeker(user.id);
      if (mountedRef.current) setApplications(list);
    } catch {
      if (mountedRef.current) setApplications([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
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

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return { applications, loading, refreshing, refresh };
}
