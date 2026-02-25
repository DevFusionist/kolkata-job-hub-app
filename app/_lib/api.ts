import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL
  ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`
  : "http://localhost:8000/api";

const REFRESH_TOKEN_KEY = "refreshToken";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(err: AxiosError): boolean {
  if (!err.response) return true;
  const status = err.response.status;
  if (status >= 500 && status < 600) return true;
  if (status === 408 || status === 429) return true;
  return false;
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

/** Optional: try to refresh JWT and retry the request. Set refreshToken in AsyncStorage when backend supports POST /auth/refresh. */
async function tryRefreshAndRetry(config: axios.AxiosRequestConfig): Promise<unknown> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return Promise.reject(new Error("Unauthorized"));
  try {
    const { data } = await axios.post<{ accessToken?: string; token?: string }>(`${API_URL.replace(/\/api$/, "")}/auth/refresh`, { refreshToken }, { timeout: 10000 });
    const newToken = data?.accessToken ?? data?.token;
    if (newToken) {
      await AsyncStorage.setItem("authToken", newToken);
      if (config.headers) (config.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
      return api.request(config);
    }
  } catch {
    // refresh failed
  }
  await AsyncStorage.multiRemove(["authToken", "user", REFRESH_TOKEN_KEY]);
  return Promise.reject(new Error("Session expired"));
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;
    const config = err.config as typeof err.config & { _retryCount?: number; _refreshed?: boolean };
    if (status === 401 && !config._refreshed) {
      config._refreshed = true;
      const result = await tryRefreshAndRetry(config).catch(() => null);
      if (result) return result;
      await AsyncStorage.multiRemove(["authToken", "user"]);
    }
    const retryCount = config._retryCount ?? 0;
    if (retryCount < MAX_RETRIES && shouldRetry(err)) {
      config._retryCount = retryCount + 1;
      await sleep(RETRY_DELAY_MS * (retryCount + 1));
      return api.request(config);
    }
    return Promise.reject(err);
  }
);

export default api;
