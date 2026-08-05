// src/app/dashboard/giving/projects/new/page.tsx - Create a new giving project

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';

export default function NewProjectPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/giving?tab=projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
            <p className="text-gray-600">Create a new giving project for the mobile app</p>
          </div>
        </div>

        {/* Form */}
        <ProjectForm />
      </div>
    </ProtectedRoute>
  );
}
