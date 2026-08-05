// src/app/dashboard/csgs/new/page.tsx - Create a new Community Service Group (CSG)

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CsgForm } from '@/components/forms/CsgForm';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';

function NewCsgPageContent() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/csgs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Community Group</h1>
          <p className="text-gray-600">Create a new Community Service Group</p>
        </div>
      </div>

      <CsgForm />
    </div>
  );
}

export default function NewCsgPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN]}>
      <NewCsgPageContent />
    </ProtectedRoute>
  );
}
