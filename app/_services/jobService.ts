import api from "../_lib/api";
import type { Job } from "../_types";

export const jobService = {
  async getJobs(params?: {
    recommended?: boolean;
    category?: string;
    jobType?: string;
    search?: string;
  }): Promise<Job[]> {
    const { data } = await api.get<Job[]>("/jobs", { params });
    return Array.isArray(data) ? data : (data as { jobs?: Job[] }).jobs ?? [];
  },

  async getJobById(id: string): Promise<Job> {
    const { data } = await api.get<Job>(`/jobs/${id}`);
    return data;
  },

  async getEmployerJobs(employerId: string): Promise<Job[]> {
    const { data } = await api.get<Job[]>(`/jobs/employer/${employerId}`);
    return Array.isArray(data) ? data : [];
  },

  async createJob(payload: Partial<Job>): Promise<Job> {
    const { data } = await api.post<Job>("/jobs", payload);
    return data;
  },
};
