import api from "../_lib/api";

export interface ChatMessagePayload {
  role: "user" | "assistant";
  content: string;
}

export interface ChatHistoryItem {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export const aiService = {
  async chat(messages: ChatMessagePayload[], userId: string): Promise<{ content: string }> {
    const { data } = await api.post<{ content: string }>("/ai/chat", {
      messages,
      userId,
    });
    return data;
  },

  async getChatHistory(userId: string, page = 1): Promise<ChatHistoryItem[]> {
    const { data } = await api.get<ChatHistoryItem[]>(`/ai/chat/history`, {
      params: { userId, page },
    });
    return Array.isArray(data) ? data : [];
  },

  async clearChatHistory(userId: string): Promise<void> {
    await api.post("/ai/chat/clear", { userId });
  },

  async runCopilotAudit(userId: string): Promise<{
    profileScore?: number;
    hireScore?: number;
    strengths?: string[];
    weaknesses?: string[];
  }> {
    const { data } = await api.post("/ai/copilot/audit", { userId });
    return data ?? {};
  },

  async suggestSkills(userId: string): Promise<{ skills: { name: string; impact?: string }[] }> {
    const { data } = await api.post("/ai/copilot/suggest-skills", { userId });
    return data ?? { skills: [] };
  },

  async optimizeExperience(userId: string, experience: string): Promise<{ optimized: string }> {
    const { data } = await api.post("/ai/copilot/optimize-experience", {
      userId,
      experience,
    });
    return data ?? { optimized: experience };
  },

  async generateResume(payload: {
    userId: string;
    experience: string;
    education?: string;
  }): Promise<{ url?: string }> {
    const { data } = await api.post("/ai/resume/generate", payload);
    return data ?? {};
  },

  async analyzeExperience(text: string): Promise<{ skills: string[] }> {
    const { data } = await api.post("/ai/analyze", { text });
    return data ?? { skills: [] };
  },
};
