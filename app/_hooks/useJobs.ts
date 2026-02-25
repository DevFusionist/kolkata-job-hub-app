import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../_contexts/AuthContext";
import { jobService } from "../_services/jobService";
import type { Job } from "../_types";

interface UseJobsOptions {
  recommended?: boolean;
  search?: string;
  category?: string;
  jobType?: string;
  /** If false, no initial load (e.g. for search screen until user searches). Default true. */
  enabled?: boolean;
}

export function useJobs(options: UseJobsOptions = {}) {
  const { user } = useAuth();
  const enabled = options.enabled !== false;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === "employer" && user?.id) {
        const list = await jobService.getEmployerJobs(user.id);
        if (mountedRef.current) setJobs(list);
      } else {
        const list = await jobService.getJobs({
          recommended: options.recommended,
          search: options.search,
          category: options.category,
          jobType: options.jobType,
        });
        if (mountedRef.current) setJobs(list);
      }
    } catch {
      if (mountedRef.current) setJobs([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user?.id, user?.role, options.recommended, options.search, options.category, options.jobType]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    load();
  }, [load, enabled]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return { jobs, loading, refreshing, refresh };
}
