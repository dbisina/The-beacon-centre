// contexts/AuthContext.tsx - FIXED with proper session persistence

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Admin, AdminLoginRequest } from '@/lib/types';

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

// API utility with improved token management
class AuthAPI {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  private static readonly TOKEN_KEY = 'tbc_admin_token';
  private static readonly REFRESH_TOKEN_KEY = 'tbc_admin_refresh_token';
  private static readonly ADMIN_KEY = 'tbc_admin_data';

  // Token management
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static removeTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_KEY);
  }

  static getStoredAdmin(): Admin | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(this.ADMIN_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static setStoredAdmin(admin: Admin): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ADMIN_KEY, JSON.stringify(admin));
  }

  // API calls with automatic token refresh
  static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      
      // If token expired, try to refresh
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.getToken()}`,
          };
          const retryResponse = await fetch(`${this.BASE_URL}${endpoint}`, config);
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, remove tokens
          this.removeTokens();
          throw new Error('Session expired');
        }
      }
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  private static async handleResponse(response: Response): Promise<any> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }
    
    return data;
  }

  // Auth specific methods
  static async login(credentials: AdminLoginRequest): Promise<{ admin: Admin; accessToken: string; refreshToken: string }> {
    const response = await this.apiCall('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setToken(response.data.accessToken);
      this.setRefreshToken(response.data.refreshToken);
      this.setStoredAdmin(response.data.admin);
      return response.data;
    }
    
    throw new Error(response.error || 'Login failed');
  }

  static async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        this.setToken(data.data.accessToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  static async getProfile(): Promise<Admin> {
    const response = await this.apiCall('/admin/auth/me');
    
    if (response.success && response.data) {
      this.setStoredAdmin(response.data);
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to get profile');
  }

  static async logout(): Promise<void> {
    try {
      await this.apiCall('/admin/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeTokens();
    }
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!admin;

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for stored admin data
        const storedAdmin = AuthAPI.getStoredAdmin();
        const token = AuthAPI.getToken();
        
        if (storedAdmin && token) {
          // Verify token is still valid
          try {
            const currentAdmin = await AuthAPI.getProfile();
            setAdmin(currentAdmin);
          } catch (error) {
            // Token invalid, try refresh
            const refreshed = await AuthAPI.refreshToken();
            if (refreshed) {
              const currentAdmin = await AuthAPI.getProfile();
              setAdmin(currentAdmin);
            } else {
              // All tokens invalid, clear storage
              AuthAPI.removeTokens();
              setAdmin(null);
            }
          }
        } else {
          setAdmin(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        AuthAPI.removeTokens();
        setAdmin(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token every 10 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await AuthAPI.refreshToken();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        // Don't logout on auto-refresh failure, let user continue
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = useCallback(async (credentials: AdminLoginRequest) => {
    try {
      setIsLoading(true);
      const response = await AuthAPI.login(credentials);
      setAdmin(response.admin);
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
      await AuthAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const currentAdmin = await AuthAPI.getProfile();
      setAdmin(currentAdmin);
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

  // Don't render children until auth is initialized
  if (!isInitialized) {
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