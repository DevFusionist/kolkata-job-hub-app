import { useState, useCallback } from "react";
import { useAuth } from "../_contexts/AuthContext";
import { jobService } from "../_services/jobService";
import type { Job, JobCategory } from "../_types";

interface PostJobState {
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  salaryMin: string;
  salaryMax: string;
}

const defaultState: PostJobState = {
  title: "",
  description: "",
  category: "other",
  location: "Kolkata",
  salaryMin: "",
  salaryMax: "",
};

export function useJobPosting() {
  const { user } = useAuth();
  const [form, setForm] = useState<PostJobState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(<K extends keyof PostJobState>(key: K, value: PostJobState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!form.title.trim()) {
      setError("Enter job title");
      return false;
    }
    if (!form.description.trim()) {
      setError("Enter description");
      return false;
    }
    const min = parseInt(form.salaryMin, 10) || 0;
    const max = parseInt(form.salaryMax, 10) || 0;
    if (max < min) {
      setError("Max salary must be >= min");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await jobService.createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        salaryMin: min,
        salaryMax: max,
        jobType: "full_time",
        experience: "0",
        skills: [],
        status: "active",
      });
      setForm({ ...defaultState, location: user?.location ?? "Kolkata" });
      return true;
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to post job");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, user?.location]);

  return { form, update, submit, loading, error };
}
