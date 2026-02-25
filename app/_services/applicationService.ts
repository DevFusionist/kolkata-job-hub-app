import api from "../_lib/api";
import type { Application } from "../_types";

export const applicationService = {
  async getBySeeker(seekerId: string): Promise<Application[]> {
    const { data } = await api.get<Application[]>(`/applications/seeker/${seekerId}`);
    return Array.isArray(data) ? data : [];
  },

  async apply(jobId: string, seekerId: string, message?: string): Promise<Application> {
    const { data } = await api.post<Application>("/applications", {
      jobId,
      seekerId,
      message,
    });
    return data;
  },

  async updateStatus(
    applicationId: string,
    status: Application["status"]
  ): Promise<Application> {
    const { data } = await api.patch<Application>(`/applications/${applicationId}`, {
      status,
    });
    return data;
  },
};
