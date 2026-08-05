// src/app/dashboard/csgs/[id]/edit/page.tsx - Edit a Community Service Group (CSG)

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CsgForm, Csg } from '@/components/forms/CsgForm';
import { csgsApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { useAuth } from '@/contexts/authContext';

interface EditCsgPageProps {
  params: {
    id: string;
  };
}

function EditCsgPageContent({ params }: EditCsgPageProps) {
  const csgId = parseInt(params.id);
  const router = useRouter();
  const { admin } = useAuth();

  // A CSG_ADMIN scoped to a different group shouldn't land on this form at all -
  // the server would 403 the update anyway, but redirecting client-side avoids a confusing error.
  useEffect(() => {
    if (admin?.role === 'CSG_ADMIN' && admin.csgId !== csgId) {
      router.replace(admin.csgId ? `/dashboard/csgs/${admin.csgId}` : '/dashboard');
    }
  }, [admin, csgId, router]);

  const { data: csg, isLoading, error } = useQuery({
    queryKey: ['csg', csgId],
    queryFn: () => csgsApi.getById(csgId) as Promise<Csg>,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !csg) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Community Group not found</h3>
        <p className="text-gray-500 mt-2">The group you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/csgs">Back to Community Groups</Link>
        </Button>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Community Group</h1>
          <p className="text-gray-600">Update group details</p>
        </div>
      </div>

      <CsgForm csg={csg} />
    </div>
  );
}

export default function EditCsgPage({ params }: EditCsgPageProps) {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.CSG_ADMIN]}>
      <EditCsgPageContent params={params} />
    </ProtectedRoute>
  );
}
