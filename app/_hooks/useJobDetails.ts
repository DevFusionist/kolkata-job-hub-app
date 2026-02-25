import { useState, useEffect, useCallback, useRef } from "react";
import { jobService } from "../_services/jobService";
import type { Job } from "../_types";

export function useJobDetails(jobId: string | undefined) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(!!jobId);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const j = await jobService.getJobById(jobId);
      if (mountedRef.current) setJob(j);
    } catch {
      if (mountedRef.current) setJob(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { job, loading, refresh: load };
}
