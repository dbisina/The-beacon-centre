// src/app/dashboard/announcements/[id]/edit/page.tsx - Edit announcement page

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementForm } from '@/components/forms/AnnouncementForm';
import { announcementsApi } from '@/lib/api';

interface EditAnnouncementPageProps {
  params: {
    id: string;
  };
}

export default function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const announcementId = parseInt(params.id);

  const { data: announcement, isLoading, error } = useQuery({
    queryKey: ['announcement', announcementId],
    queryFn: () => announcementsApi.getById(announcementId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Announcement not found</h3>
        <p className="text-gray-500 mt-2">The announcement you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/announcements">Back to Announcements</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Announcement</h1>
          <p className="text-gray-600">Update announcement details</p>
        </div>
      </div>

      {/* Form */}
      <AnnouncementForm announcement={announcement} />
    </div>
  );
}