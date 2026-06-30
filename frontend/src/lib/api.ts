import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refresh_token');
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = response.data.data;
        Cookies.set('access_token', accessToken, { secure: true, sameSite: 'strict' });
        Cookies.set('refresh_token', newRefresh, { secure: true, sameSite: 'strict' });
        processQueue(null, accessToken);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { email?: string; username?: string; password: string }) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  profile: () => api.get('/auth/profile'),
};

// Users API
export const usersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  adjustBalance: (id: string, data: Record<string, unknown>) => api.post(`/users/${id}/balance`, data),
};

// Licenses API
export const licensesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/licenses', { params }),
  getById: (id: string) => api.get(`/licenses/${id}`),
  getMy: () => api.get('/licenses/my'),
  create: (data: Record<string, unknown>) => api.post('/licenses', data),
  bulkCreate: (data: Record<string, unknown>) => api.post('/licenses/bulk', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/licenses/${id}`, data),
  delete: (id: string) => api.delete(`/licenses/${id}`),
  suspend: (id: string) => api.post(`/licenses/${id}/suspend`),
  resume: (id: string) => api.post(`/licenses/${id}/resume`),
  validate: (data: { key: string; deviceId: string }) => api.post('/licenses/validate', data),
};

// Products API
export const productsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics'),
  getTransactions: (period?: string) => api.get('/analytics/transactions', { params: { period } }),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, string>) => api.put('/settings', data),
  getLogs: (params?: Record<string, unknown>) => api.get('/settings/logs', { params }),
};

export default api;
