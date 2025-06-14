// contexts/AuthContext.tsx - Authentication state management

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Admin, AdminLoginRequest } from '@/lib/types';

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!admin;

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authApi.getToken();
        if (token) {
          const profile = await authApi.getProfile();
          setAdmin(profile);
        }
      } catch (error) {
        // Token is invalid, remove it
        authApi.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: AdminLoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      setAdmin(response.admin);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      router.push('/login');
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      setAdmin(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    admin,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};