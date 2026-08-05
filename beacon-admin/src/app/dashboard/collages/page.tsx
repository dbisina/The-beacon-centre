'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Images, Plus, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { collagesApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';

interface Collage {
  id: number;
  date: string;
  coverImageUrl: string;
  photoCount: number;
  isActive: boolean;
}

function CollagesPageContent() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<Collage[]>({
    queryKey: ['collages'],
    queryFn: collagesApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => collagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['collages']);
      toast({ title: 'Success', description: 'Collage deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to delete collage',
        variant: 'destructive',
      });
    },
  });

  const collages = data ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photo Collages</h1>
          <p className="text-gray-600">Sunday photo sets - the one marked as cover shows on the app's home screen that day, then it moves to the gallery archive.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/collages/new">
            <Plus className="mr-2 h-4 w-4" />
            New Collage
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : collages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Images className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No collages yet</h3>
          <p className="text-gray-500 mb-6">Add this Sunday's photos to get started.</p>
          <Button asChild>
            <Link href="/dashboard/collages/new">
              <Plus className="mr-2 h-4 w-4" />
              New Collage
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collages.map((c) => (
            <div key={c.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-40">
                <img src={c.coverImageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDeleteId(c.id)}
                    className="bg-white/90 hover:bg-white text-red-600 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900">{format(new Date(c.date), 'EEEE, MMM d, yyyy')}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{c.photoCount} photo{c.photoCount === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collage</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the collage and all its photos, including from Cloudinary storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CollagesPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR]}>
      <CollagesPageContent />
    </ProtectedRoute>
  );
}
