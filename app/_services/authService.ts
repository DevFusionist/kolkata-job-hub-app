import api from "../_lib/api";
import type { User } from "../_types";

export type OtpPurpose = "register" | "reset_mpin";

export type VerifyOtpResult =
  | { success: true; isNewUser: true; phone: string; registrationToken: string }
  | { success: true; isNewUser: false; purpose: "reset_mpin"; phone: string; mpinResetToken: string; user: { id: string; name: string; role: string } };

export const authService = {
  async sendOtp(phone: string, purpose: OtpPurpose): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post("/auth/send-otp", { phone, purpose });
    return data;
  },

  async verifyOtp(
    phone: string,
    otp: string,
    purpose: OtpPurpose
  ): Promise<VerifyOtpResult> {
    const { data } = await api.post("/auth/verify-otp", { phone, otp, purpose });
    return data as VerifyOtpResult;
  },

  async login(phone: string, mpin: string): Promise<{ success: true; user: User; token: string }> {
    const { data } = await api.post("/auth/login", { phone, mpin });
    return data;
  },

  async setMpin(
    mpin: string,
    options?: { authToken?: string; resetToken?: string }
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {};
    if (options?.authToken) headers.Authorization = `Bearer ${options.authToken}`;
    if (options?.resetToken) headers["x-mpin-reset-token"] = options.resetToken;
    const { data } = await api.post("/auth/set-mpin", { mpin }, headers ? { headers } : undefined);
    return data;
  },

  async register(payload: {
    phone: string;
    registrationToken: string;
    name: string;
    role: "seeker" | "employer";
    businessName?: string;
    location?: string;
    [key: string]: unknown;
  }): Promise<{ user: User; token: string }> {
    const { data } = await api.post<User & { token: string }>("/users", payload);
    const { token, ...user } = data;
    return { user: user as User, token };
  },
};
