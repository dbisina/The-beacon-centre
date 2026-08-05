// src/app/dashboard/admin-users/new/page.tsx - Create admin account (SUPER_ADMIN only)

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminUserForm } from '@/components/forms/AdminUserForm';
import { AdminRole } from '@/lib/types';

function NewAdminUserPageContent() {
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
          <h1 className="text-3xl font-bold text-gray-900">New Admin</h1>
          <p className="text-gray-600">Create a new admin account</p>
        </div>
      </div>

      <AdminUserForm isEdit={false} />
    </div>
  );
}

export default function NewAdminUserPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN]}>
      <NewAdminUserPageContent />
    </ProtectedRoute>
  );
}
