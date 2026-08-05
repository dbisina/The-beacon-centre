// components/ProtectedRoute.tsx - Protect admin routes

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/authContext';
import { AdminRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireRole?: AdminRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = true,
  requireSuperAdmin = false,
  requireRole,
}) => {
  const { admin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (requireSuperAdmin && admin?.role !== 'SUPER_ADMIN') {
        router.push('/dashboard'); // Redirect to dashboard if not super admin
        return;
      }

      if (requireRole && (!admin || !requireRole.includes(admin.role))) {
        router.push('/dashboard'); // Redirect to dashboard if role not permitted
        return;
      }

      if (requireAdmin && !admin) {
        router.push('/login');
        return;
      }
    }
  }, [isLoading, isAuthenticated, admin, router, requireAdmin, requireSuperAdmin, requireRole]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (
    !isAuthenticated ||
    (requireSuperAdmin && admin?.role !== 'SUPER_ADMIN') ||
    (requireRole && (!admin || !requireRole.includes(admin.role)))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};