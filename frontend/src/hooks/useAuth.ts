'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, getUser, setUser, setTokens, clearTokens } from '../lib/auth';
import { authApi } from '../lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextType {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) setUserState(storedUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const isEmail = identifier.includes('@');
    const payload = isEmail ? { email: identifier, password } : { username: identifier, password };
    const response = await authApi.login(payload);
    const { user: userData, tokens } = response.data.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(userData);
    setUserState(userData);
    toast.success(`Welcome back, ${userData.username}!`);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      const { getRefreshToken } = await import('../lib/auth');
      const refreshToken = getRefreshToken();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore
    }
    clearTokens();
    setUserState(null);
    router.push('/login');
    toast.success('Logged out successfully');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authApi.profile();
      const userData = response.data.data;
      setUser(userData);
      setUserState(userData);
    } catch {
      // ignore
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshProfile,
  };
}
