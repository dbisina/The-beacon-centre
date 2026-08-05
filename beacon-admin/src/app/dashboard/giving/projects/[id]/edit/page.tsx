// src/app/dashboard/giving/projects/[id]/edit/page.tsx - Edit a giving project

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectForm, Project } from '@/components/forms/ProjectForm';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { projectsApi } from '@/lib/api';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const projectId = parseInt(params.id);

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600">Update project details</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error || !project ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
            <p className="text-gray-500 mt-2">The project you're looking for doesn't exist.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/giving?tab=projects">Back to Projects</Link>
            </Button>
          </div>
        ) : (
          <ProjectForm project={project} />
        )}
      </div>
    </ProtectedRoute>
  );
}
