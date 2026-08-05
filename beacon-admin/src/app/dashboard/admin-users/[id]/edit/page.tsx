// src/app/dashboard/admin-users/[id]/edit/page.tsx - Edit admin account (SUPER_ADMIN only)

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminUserForm, AdminUser } from '@/components/forms/AdminUserForm';
import { adminsApi } from '@/lib/api';
import { AdminRole } from '@/lib/types';

interface EditAdminUserPageProps {
  params: {
    id: string;
  };
}

function EditAdminUserPageContent({ params }: EditAdminUserPageProps) {
  const adminId = parseInt(params.id);

  // adminsApi has no getById endpoint - fetch the full list (shared cache key
  // with the admin-users list page) and find this record by id.
  const { data: admins, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminsApi.getAll() as Promise<AdminUser[]>,
  });

  const admin = admins?.find((a) => a.id === adminId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Admin not found</h3>
        <p className="text-gray-500 mt-2">The admin account you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/admin-users">Back to Admin Management</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin-users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Admin</h1>
          <p className="text-gray-600">Update admin account details</p>
        </div>
      </div>

      <AdminUserForm isEdit admin={admin} />
    </div>
  );
}

export default function EditAdminUserPage(props: EditAdminUserPageProps) {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN]}>
      <EditAdminUserPageContent {...props} />
    </ProtectedRoute>
  );
}
