'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Admin, AdminLoginRequest } from '@/lib/types';
import { authApi, setAuthToken, clearAuth, getAuthToken } from '@/lib/api';

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Token management utilities
const getStoredAdmin = (): Admin | null => {
  try {
    const stored = localStorage.getItem('tbc_admin_data');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredAdmin = (admin: Admin): void => {
  try {
    localStorage.setItem('tbc_admin_data', JSON.stringify(admin));
  } catch (error) {
    console.error('Failed to store admin data:', error);
  }
};

const removeStoredData = (): void => {
  try {
    localStorage.removeItem('tbc_admin_token');
    localStorage.removeItem('tbc_admin_refresh_token');
    localStorage.removeItem('tbc_admin_data');
  } catch (error) {
    console.error('Failed to remove stored data:', error);
  }
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!admin;

  // Set client flag after mount to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize authentication state
  useEffect(() => {
    if (!isClient) return;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Initializing authentication...');
        
        // Check for stored admin data and token
        const storedAdmin = getStoredAdmin();
        const token = getAuthToken();
        
        console.log('📦 Stored data:', { 
          hasAdmin: !!storedAdmin, 
          hasToken: !!token,
          adminEmail: storedAdmin?.email 
        });
        
        if (storedAdmin && token) {
          // Verify token is still valid by getting current profile
          try {
            console.log('🔍 Validating token...');
            const currentAdmin = await authApi.getProfile();
            setAdmin(currentAdmin.data);
            setStoredAdmin(currentAdmin.data);
            console.log('✅ Token validation successful');
          } catch (error) {
            console.warn('❌ Token validation failed, clearing auth data:', error);
            // Token invalid, clear storage
            clearAuth();
            removeStoredData();
            setAdmin(null);
          }
        } else {
          console.log('📭 No stored auth data found');
          setAdmin(null);
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        clearAuth();
        removeStoredData();
        setAdmin(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        console.log('✅ Auth initialization complete');
      }
    };

    initializeAuth();
  }, [isClient]);

  const login = useCallback(async (credentials: AdminLoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      setAdmin(response.admin);
      setStoredAdmin(response.admin);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      removeStoredData();
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      setAdmin(response.data);
      setStoredAdmin(response.data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // On profile refresh failure, logout user
      await logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    admin,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    refreshProfile,
  };

  // Don't render children until auth is initialized and we're on client
  if (!isInitialized || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};