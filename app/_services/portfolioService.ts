import api from "../_lib/api";

export interface Portfolio {
  experience?: string;
  skills?: string[];
  projects?: string[];
  resumeUrl?: string;
}

export const portfolioService = {
  async getBySeeker(seekerId: string): Promise<Portfolio | null> {
    try {
      const { data } = await api.get<Portfolio>(`/portfolios/seeker/${seekerId}`);
      return data ?? null;
    } catch {
      return null;
    }
  },

  async uploadResume(seekerId: string, formData: FormData): Promise<{ url?: string }> {
    const { data } = await api.post<{ url?: string }>(
      "/portfolios/upload-resume",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data ?? {};
  },

  async getResumeViewUrl(seekerId: string): Promise<{ url: string }> {
    const { data } = await api.get<{ url: string }>(
      `/portfolios/resume-view-url`,
      { params: { seekerId } }
    );
    return data;
  },
};
