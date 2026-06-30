import Cookies from 'js-cookie';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'RESELLER';
  balance: number;
  isActive: boolean;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export const setTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('access_token', accessToken, { secure: true, sameSite: 'strict', expires: 1 });
  Cookies.set('refresh_token', refreshToken, { secure: true, sameSite: 'strict', expires: 7 });
};

export const clearTokens = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  localStorage.removeItem('user');
};

export const getAccessToken = () => Cookies.get('access_token');
export const getRefreshToken = () => Cookies.get('refresh_token');

export const setUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
