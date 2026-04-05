import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { getCognitoIdTokenForApi } from '@/lib/auth/apiToken';

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getCognitoIdTokenForApi();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RequestConfigWithRetry | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const token = await getCognitoIdTokenForApi({ forceRefresh: true });
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      }
    }

    if (error.response) {
      console.error(`[API Error] ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[API Error] El servidor no responde. Verifica tu conexión.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
