// src/app/dashboard/video-sermons/[id]/edit/page.tsx - Edit video sermon page
'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoSermonForm } from '@/components/forms/VideoSermonForm';
import { videoSermonsApi } from '@/lib/api';

interface EditVideoSermonPageProps {
  params: {
    id: string;
  };
}

export default function EditVideoSermonPage({ params }: EditVideoSermonPageProps) {
  const sermonId = parseInt(params.id);

  const { data: sermon, isLoading, error } = useQuery({
    queryKey: ['video-sermon', sermonId],
    queryFn: () => videoSermonsApi.getById(sermonId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !sermon) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Video sermon not found</h3>
        <p className="text-gray-500 mt-2">The video sermon you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/video-sermons">Back to Video Sermons</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/video-sermons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Video Sermon</h1>
          <p className="text-gray-600">Update video sermon details</p>
        </div>
      </div>

      {/* Form */}
      <VideoSermonForm sermon={sermon} />
    </div>
  );
}