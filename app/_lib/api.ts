import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://kolkata-job-hub-app-backend-production.up.railway.app';
  console.log("API_URL", API_URL);

const api = axios.create({
  baseURL: `${API_URL.replace(/\/$/, '')}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT if available
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore storage errors
  }
  return config;
});

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail || '';
      if (detail === 'Token expired' || detail === 'Invalid token') {
        // Token invalid - clear it (AuthContext will redirect to login)
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
